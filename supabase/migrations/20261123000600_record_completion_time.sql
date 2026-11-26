begin;

create or replace function public.write_training(
  p_user uuid, p_id uuid, p_kind text, p_started_at timestamptz, p_seconds integer,
  p_camera jsonb, p_preparation jsonb, p_final jsonb, p_guest boolean
) returns void language plpgsql security definer set search_path = ''
as $$
declare
  session public.training_sessions%rowtype;
  finish_status text;
  camera_at timestamptz;
  final_at timestamptz;
begin
  if p_guest then
    if p_kind <> 'course' or p_preparation is null or p_final is null or not exists (
      select 1 from auth.users where id = p_user and email_confirmed_at is not null
    ) then raise exception 'A verified account and complete guest record are required' using errcode = '42501'; end if;
    insert into public.training_sessions(id, user_id, training_type, started_at)
      values (p_id, p_user, 'course', least(p_started_at, now())) on conflict (id) do nothing;
  end if;

  select * into session from public.training_sessions where id = p_id for update;
  if not found or session.user_id <> p_user or session.training_type <> p_kind then
    raise exception 'Training session unavailable' using errcode = '42501';
  end if;
  if session.status = 'completed' or (session.status = 'interrupted' and p_final is null and exists (
    select 1 from public.camera_training_results where session_id = p_id
  )) then return; end if;

  if p_kind = 'course' then
    if p_guest then
      perform public.prepare_course(p_user, p_id, p_preparation);
    elsif not exists (select 1 from public.learning_progress where session_id = p_id) or
      (p_final is not null and not exists (select 1 from public.camera_training_results where session_id = p_id)) then
      raise exception 'Required course checkpoints are missing' using errcode = '42501';
    end if;
  end if;

  camera_at := greatest(session.started_at, least(now(), coalesce((p_camera->>'finishedAt')::timestamptz, now())));
  final_at := greatest(camera_at, least(now(), coalesce((p_final->>'finishedAt')::timestamptz, now())));

  insert into public.camera_training_results (
    session_id, recorded_at, repetitions, target_repetitions, last_cadence, camera_seconds,
    technique_score, rhythm_score, completion_score, overall_score, rating, tips
  ) values (
    p_id, camera_at, (p_camera->>'totalCompressions')::integer, (p_camera->>'targetCompressions')::integer,
    nullif((p_camera->>'averageBpm')::integer, 0), (p_camera->>'durationSeconds')::integer,
    (p_camera->>'techniqueScore')::integer, (p_camera->>'rhythmScore')::integer,
    (p_camera->>'completionScore')::integer, (p_camera->>'overallScore')::integer,
    p_camera->>'rating', array(select jsonb_array_elements_text(p_camera->'tips'))
  ) on conflict do nothing;

  if p_kind = 'course' then
    if p_final is not null then
      perform corcpr_private.record_assessment(p_id, 'final', p_final->'answers');
      update public.self_assessments set final_confidence = (p_final->>'confidence')::integer where session_id = p_id;
      update public.learning_progress set final_assessment_at = final_at where session_id = p_id;
      insert into public.initial_course_completions(user_id, session_id, completed_at)
        values (p_user, p_id, final_at) on conflict (user_id) do nothing;
      finish_status := 'completed';
    end if;
  else
    finish_status := case
      when (select repetitions = target_repetitions from public.camera_training_results where session_id = p_id)
        then 'completed' else 'interrupted' end;
  end if;

  update public.training_sessions set
    activity_at = case when p_guest then final_at else now() end,
    active_seconds = greatest(active_seconds, least(86400, p_seconds,
      greatest(0, extract(epoch from now() - started_at)::integer + 2))),
    status = coalesce(finish_status, status),
    ended_at = case when finish_status is null then ended_at
      when p_kind = 'course' then final_at else camera_at end
  where id = p_id;
end $$;

commit;
