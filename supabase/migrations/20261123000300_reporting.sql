begin;

create function public.training_overview(p_user uuid)
returns jsonb language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'completed', count(*) filter (where status = 'completed'),
    'recorded', count(*),
    'seconds', coalesce(sum(active_seconds), 0),
    'latest', max(ended_at) filter (where status = 'completed')
  ) from public.training_sessions where user_id = p_user
$$;

create function public.staff_directory(p_search text, p_offset integer)
returns table (
  user_id uuid, display_name text, last_login timestamptz, last_activity timestamptz,
  completed bigint, active_seconds bigint, camera_score integer, final_correct integer,
  final_total integer, course_completed boolean
) language sql stable security invoker set search_path = ''
as $$
  select p.user_id, p.display_name, r.last_login_at,
    (select max(s.activity_at) from public.training_sessions s where s.user_id = p.user_id),
    (select count(*) from public.training_sessions s where s.user_id = p.user_id and s.status = 'completed'),
    coalesce((select sum(s.active_seconds) from public.training_sessions s where s.user_id = p.user_id), 0),
    c.overall_score, k.correct_count, k.question_count, f.user_id is not null
  from public.staff_roster() r join public.user_profiles p on p.user_id = r.user_id
  left join public.initial_course_completions f on f.user_id = p.user_id
  left join lateral (
    select x.overall_score from public.camera_training_results x
    join public.training_sessions s on s.id = x.session_id
    where s.user_id = p.user_id order by s.started_at desc, s.id desc limit 1
  ) c on true
  left join lateral (
    select x.correct_count, x.question_count from public.knowledge_assessment_attempts x
    join public.training_sessions s on s.id = x.session_id
    where s.user_id = p.user_id and x.assessment = 'final' order by s.started_at desc, s.id desc limit 1
  ) k on true
  where strpos(lower(p.display_name), lower(left(coalesce(p_search,''), 80))) > 0
     or coalesce(p_search,'') = ''
  order by lower(p.display_name), p.user_id
  limit 26 offset greatest(0, least(20000, coalesce(p_offset,0)))
$$;

create function public.staff_training_summary(p_days integer)
returns jsonb language sql stable security invoker set search_path = ''
as $$
  with cutoff as (
    select now() - make_interval(days => greatest(1, least(90, coalesce(p_days, 30)))) as ts
  ), roster as (
    select user_id from public.staff_roster()
  ), recent as (
    select s.* from public.training_sessions s join roster r using (user_id), cutoff c
      where s.activity_at >= c.ts
  ), knowledge as (
    select avg(100.0 * k.correct_count / nullif(k.question_count, 0)) as score
    from public.knowledge_assessment_attempts k join recent s on s.id = k.session_id, cutoff c
    where k.assessment = 'final' and k.recorded_at >= c.ts and s.status = 'completed'
  ), weeks as (
    select date_trunc('week', started_at at time zone 'UTC') as week, count(*) as attempts,
      count(*) filter (where status = 'completed') as completed
    from recent where started_at >= (select ts from cutoff) group by 1 order by 1
  )
  select jsonb_build_object(
    'students', (select count(*) from roster),
    'active', (select count(distinct user_id) from recent),
    'completed', (select count(*) from recent
      where status = 'completed' and ended_at >= (select ts from cutoff)),
    'knowledge', (select round(score) from knowledge),
    'weeks', coalesce((select jsonb_agg(to_jsonb(w) order by week) from weeks w), '[]'::jsonb)
  )
$$;

revoke all on function public.training_overview(uuid), public.staff_directory(text,integer),
  public.staff_training_summary(integer) from public, anon, authenticated, service_role;
grant execute on function public.training_overview(uuid), public.staff_directory(text,integer),
  public.staff_training_summary(integer) to authenticated;

commit;
