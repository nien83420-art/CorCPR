begin;

alter table public.self_assessments
  add column experience_category text check (experience_category in ('none', 'theory', 'manikin', 'real_event')),
  add column initial_recorded_at timestamptz,
  add constraint self_assessment_experience_timestamp check ((experience_category is null) = (initial_recorded_at is null));

create function public.record_course_self_assessment(p_user uuid, p_id uuid, p_experience text, p_confidence integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  saved public.self_assessments%rowtype;
begin
  perform 1 from public.training_sessions
    where id = p_id and user_id = p_user and training_type = 'course' and status = 'in_progress'
    for update;
  if not found then
    raise exception 'Course session unavailable' using errcode = '42501';
  end if;
  if p_experience is null or p_confidence is null then
    raise exception 'Both self-assessment responses are required' using errcode = '22023';
  end if;

  insert into public.self_assessments(session_id, initial_confidence, experience_category, initial_recorded_at)
    values (p_id, p_confidence, p_experience, clock_timestamp()) on conflict (session_id) do nothing;
  select * into saved from public.self_assessments where session_id = p_id;
  return jsonb_build_object('experience', saved.experience_category, 'confidence', saved.initial_confidence,
    'answeredAt', (extract(epoch from saved.initial_recorded_at) * 1000)::bigint);
end $$;

revoke all on function public.record_course_self_assessment(uuid,uuid,text,integer) from public, anon, authenticated, service_role;
grant execute on function public.record_course_self_assessment(uuid,uuid,text,integer) to service_role;

create or replace function public.prepare_course(p_user uuid, p_id uuid, p_preparation jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform 1 from public.training_sessions
    where id = p_id and user_id = p_user and training_type = 'course' for update;
  if not found or p_preparation is null then
    raise exception 'Course preparation unavailable' using errcode = '42501';
  end if;
  insert into public.learning_progress(session_id) values (p_id) on conflict do nothing;
  insert into public.self_assessments(session_id, initial_confidence, experience_category, initial_recorded_at)
    values (p_id, (p_preparation->>'confidence')::integer, p_preparation#>>'{assessment,experience}',
      to_timestamp((p_preparation#>>'{assessment,answeredAt}')::double precision / 1000))
    on conflict (session_id) do nothing;
  perform corcpr_private.record_assessment(p_id, 'intro', p_preparation->'answers');
end $$;

commit;
