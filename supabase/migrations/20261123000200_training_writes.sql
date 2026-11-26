begin;

create function public.begin_training(p_user uuid, p_id uuid, p_kind text, p_mfa boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from auth.users where id = p_user and email_confirmed_at is not null)
    or p_kind not in ('course', 'camera') then
    raise exception 'Verified account and training type required' using errcode = '42501';
  end if;
  if p_kind = 'camera' and not (
    (corcpr_private.role_of(p_user) <> 'student' and p_mfa is true)
    or exists (select 1 from public.initial_course_completions where user_id = p_user)
  ) then raise exception 'Complete the initial course first' using errcode = '42501'; end if;

  insert into public.training_sessions(id, user_id, training_type)
  values (p_id, p_user, p_kind) on conflict (id) do nothing;
  if not exists (select 1 from public.training_sessions
    where id = p_id and user_id = p_user and training_type = p_kind) then
    raise exception 'Training session unavailable' using errcode = '42501';
  end if;
end $$;

create function public.training_heartbeat(p_user uuid, p_id uuid, p_active_seconds integer, p_interrupt boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.training_sessions set
    activity_at = now(),
    active_seconds = greatest(active_seconds, least(86400, p_active_seconds,
      greatest(0, extract(epoch from now() - started_at)::integer + 2))),
    status = case when p_interrupt then 'interrupted' else status end,
    ended_at = case when p_interrupt then now() else ended_at end
  where id = p_id and user_id = p_user and status = 'in_progress';
end $$;

create function corcpr_private.record_assessment(p_id uuid, p_phase text, p_answers jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.knowledge_assessment_attempts(session_id, assessment, correct_count, question_count)
    select p_id, p_phase, count(*) filter (where (answer->>'isCorrect')::boolean), count(*)
    from jsonb_array_elements(p_answers) answer
    on conflict do nothing;
  insert into public.knowledge_assessment_answers(session_id, assessment, question_id, is_correct, response)
    select p_id, p_phase, answer->>'question', (answer->>'isCorrect')::boolean, answer->'response'
    from jsonb_array_elements(p_answers) answer on conflict do nothing;
end $$;

create function public.write_training(
  p_user uuid, p_id uuid, p_kind text, p_started_at timestamptz, p_seconds integer,
  p_camera jsonb, p_preparation jsonb, p_final jsonb, p_guest boolean
) returns void language plpgsql security definer set search_path = ''
as $$
declare
  session public.training_sessions%rowtype;
  finish_status text;
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

  insert into public.camera_training_results (
    session_id, repetitions, target_repetitions, last_cadence, camera_seconds,
    technique_score, rhythm_score, completion_score, overall_score, rating, tips
  ) values (
    p_id, (p_camera->>'totalCompressions')::integer, (p_camera->>'targetCompressions')::integer,
    nullif((p_camera->>'averageBpm')::integer, 0), (p_camera->>'durationSeconds')::integer,
    (p_camera->>'techniqueScore')::integer, (p_camera->>'rhythmScore')::integer,
    (p_camera->>'completionScore')::integer, (p_camera->>'overallScore')::integer,
    p_camera->>'rating', array(select jsonb_array_elements_text(p_camera->'tips'))
  ) on conflict do nothing;

  if p_kind = 'course' then
    if p_preparation is null then raise exception 'Preparation records required' using errcode = '22023'; end if;
    insert into public.learning_progress(session_id) values (p_id) on conflict do nothing;
    insert into public.self_assessments(session_id, initial_confidence)
      values (p_id, (p_preparation->>'confidence')::integer) on conflict do nothing;
    perform corcpr_private.record_assessment(p_id, 'intro', p_preparation->'answers');
    if p_final is not null then
      perform corcpr_private.record_assessment(p_id, 'final', p_final->'answers');
      update public.self_assessments set final_confidence = (p_final->>'confidence')::integer where session_id = p_id;
      update public.learning_progress set final_assessment_at = now() where session_id = p_id;
      insert into public.initial_course_completions(user_id, session_id)
        values (p_user, p_id) on conflict (user_id) do nothing;
      finish_status := 'completed';
    end if;
  else
    finish_status := case
      when (select repetitions = target_repetitions from public.camera_training_results where session_id = p_id)
        then 'completed' else 'interrupted' end;
  end if;

  update public.training_sessions set
    activity_at = now(),
    active_seconds = greatest(active_seconds, least(86400, p_seconds,
      greatest(0, extract(epoch from now() - started_at)::integer + 2))),
    status = coalesce(finish_status, status),
    ended_at = case when finish_status is not null then now() else ended_at end
  where id = p_id;
end $$;

revoke all on function public.begin_training(uuid,uuid,text,boolean),
  public.training_heartbeat(uuid,uuid,integer,boolean),
  public.write_training(uuid,uuid,text,timestamptz,integer,jsonb,jsonb,jsonb,boolean)
from public, anon, authenticated, service_role;
grant execute on function public.begin_training(uuid,uuid,text,boolean),
  public.training_heartbeat(uuid,uuid,integer,boolean),
  public.write_training(uuid,uuid,text,timestamptz,integer,jsonb,jsonb,jsonb,boolean)
to service_role;
revoke all on function corcpr_private.record_assessment(uuid,text,jsonb) from public, anon, authenticated, service_role;

commit;
