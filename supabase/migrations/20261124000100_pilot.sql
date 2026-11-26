begin;

create table public.pilot_enrollments (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  notice_version integer not null default 1 check (notice_version = 1)
);

create table public.pilot_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  kind text not null check (kind in ('visit','sign_in','module_started','module_completed','camera_started')),
  session_id uuid,
  module smallint check (module between 1 and 7),
  occurred_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, event_key),
  foreign key (user_id, session_id) references public.training_sessions(user_id,id) on delete cascade,
  check ((session_id is not null) = (kind in ('module_started','module_completed','camera_started'))),
  check ((module is not null) = (kind in ('module_started','module_completed')))
);
create index pilot_events_timeline on public.pilot_events (user_id, occurred_at desc);
create index pilot_events_session on public.pilot_events (session_id);

create table public.pilot_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminder_days smallint not null default 0 check (reminder_days in (0,3,7,14,30)),
  reminders_since timestamptz not null default now(),
  plan_week date,
  plan_done text[] not null default '{}'
    check (plan_done <@ array['course','knowledge','camera','review']::text[])
);

create table public.pilot_support (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('problem','help','feedback')),
  message text not null check (char_length(btrim(message)) between 5 and 2000),
  status text not null default 'open' check (status in ('open','reviewing','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pilot_support_user on public.pilot_support (user_id, created_at desc);
create index pilot_support_queue on public.pilot_support (status, created_at desc);

alter table public.pilot_enrollments enable row level security;
alter table public.pilot_events enable row level security;
alter table public.pilot_preferences enable row level security;
alter table public.pilot_support enable row level security;

revoke all on public.pilot_enrollments, public.pilot_events, public.pilot_preferences, public.pilot_support
  from public, anon, authenticated, service_role;
grant select on public.pilot_enrollments, public.pilot_events, public.pilot_preferences, public.pilot_support to authenticated;

create policy pilot_enrollment_read on public.pilot_enrollments for select to authenticated
  using (user_id = (select auth.uid()) or
    (withdrawn_at is null and corcpr_private.can_view_student(user_id)));
create policy pilot_event_read on public.pilot_events for select to authenticated
  using (user_id = (select auth.uid()) or (
    corcpr_private.can_view_student(user_id) and exists (
      select 1 from public.pilot_enrollments e
      where e.user_id = pilot_events.user_id and e.withdrawn_at is null and pilot_events.occurred_at >= e.enrolled_at
    )
  ));
create policy pilot_preferences_read on public.pilot_preferences for select to authenticated
  using (user_id = (select auth.uid()));
create policy pilot_support_read on public.pilot_support for select to authenticated
  using (user_id = (select auth.uid()) or (select corcpr_private.is_elevated('admin')));

create function public.set_pilot_enrollment(p_join boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or p_join is null or corcpr_private.role_of(actor) <> 'student'
     or not exists (select 1 from auth.users where id = actor and email_confirmed_at is not null) then
    raise exception 'Verified student required' using errcode = '42501';
  end if;
  if p_join then
    insert into public.pilot_enrollments (user_id) values (actor)
    on conflict (user_id) do update set enrolled_at = now(), withdrawn_at = null
      where pilot_enrollments.withdrawn_at is not null;
  else
    update public.pilot_enrollments set withdrawn_at = now() where user_id = actor and withdrawn_at is null;
  end if;
  return p_join;
end
$$;

-- Called only after the app verifies the real session. UTC-day keys make reloads idempotent.
create function public.record_pilot_event(p_user uuid, p_kind text, p_session uuid default null, p_module integer default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  recorded timestamptz := now();
  event_id text;
  session_type text;
  enrollment_start timestamptz;
begin
  if p_user is null or not exists (select 1 from auth.users where id = p_user and email_confirmed_at is not null) then
    return false;
  end if;
  if p_kind in ('visit','sign_in') then
    select enrolled_at into enrollment_start from public.pilot_enrollments where user_id=p_user and withdrawn_at is null;
    if not found or p_session is not null or p_module is not null then return false; end if;
    event_id := p_kind || ':' || (recorded at time zone 'UTC')::date || ':' || extract(epoch from enrollment_start);
  elsif p_kind in ('module_started','module_completed','camera_started') then
    select training_type into session_type from public.training_sessions
      where id = p_session and user_id = p_user and status = 'in_progress';
    if not found then return false; end if;
    if p_kind like 'module_%' then
      if session_type <> 'course' or p_module is null or p_module not between 1 and 7 then return false; end if;
      if p_module > 1 and not exists (
        select 1 from public.pilot_events where user_id = p_user and session_id = p_session
          and kind = 'module_completed' and module = p_module - 1
      ) then return false; end if;
      if p_kind = 'module_completed' and not exists (
        select 1 from public.pilot_events where user_id = p_user and session_id = p_session
          and kind = 'module_started' and module = p_module
      ) then return false; end if;
      if p_kind = 'module_completed' and p_module = 7 and not exists (
        select 1 from public.learning_progress where session_id = p_session
      ) then return false; end if;
    elsif p_module is not null then
      return false;
    end if;
    event_id := p_kind || ':' || p_session || ':' || coalesce(p_module, 0);
  else
    return false;
  end if;
  insert into public.pilot_events(user_id,event_key,kind,session_id,module)
    values(p_user,event_id,p_kind,p_session,p_module)
  on conflict (user_id,event_key) do update set last_seen_at = recorded
    where pilot_events.kind in ('visit','sign_in')
      and pilot_events.last_seen_at < recorded - interval '1 minute';
  return true;
end
$$;

create function public.pilot_roster()
returns table (user_id uuid, registered_at timestamptz, enrolled_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.user_id, u.created_at, e.enrolled_at
  from public.staff_roster() r
  join public.pilot_enrollments e on e.user_id = r.user_id and e.withdrawn_at is null
  join auth.users u on u.id = r.user_id and u.email_confirmed_at is not null
$$;

create function public.pilot_progress(p_user uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with allowed as (
    select p_user as id where p_user = auth.uid()
      or exists (select 1 from public.pilot_roster() where user_id = p_user)
  ), sessions as (
    select s.* from public.training_sessions s join allowed a on a.id = s.user_id
  ), events as (
    select e.* from public.pilot_events e join allowed a on a.id = e.user_id
  ), activity as (
    select (occurred_at at time zone 'UTC')::date as day,
      min(occurred_at) filter (where kind = 'visit') as visit,
      max(last_seen_at) as last_seen,
      bool_or(kind = 'sign_in') as signed_in
    from events where kind in ('visit','sign_in') group by 1
  ), recent_activity as (
    select * from activity order by day desc limit 90
  ), frequency as (
    select (started_at at time zone 'UTC')::date as day, count(*) as started,
      count(*) filter (where status = 'completed') as completed
    from sessions where started_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' - interval '29 days'
    group by 1
  ), points as (
    select s.id, s.started_at, c.overall_score as camera,
      case when q.question_count > 0 then round(100.0*q.correct_count/q.question_count)::integer end as knowledge
    from sessions s left join public.camera_training_results c on c.session_id=s.id
      left join public.knowledge_assessment_attempts q on q.session_id=s.id and q.assessment='final'
    where c.overall_score is not null or q.question_count > 0
    order by s.started_at desc, s.id desc limit 40
  )
  select jsonb_build_object(
    'registeredAt', (select registered_at from public.pilot_roster() where user_id=p_user),
    'firstVisit', (select min(visit) from activity),
    'lastActivity', (select max(last_seen) from activity),
    'activeDays', (select count(*) from activity where visit is not null),
    'trainingDays', (select count(distinct (ended_at at time zone 'UTC')::date) from sessions where status='completed'),
    'started', (select count(*) from sessions),
    'firstCourse', exists(select 1 from public.initial_course_completions where user_id=p_user),
    'cameraCompleted', exists (
      select 1 from sessions s join public.camera_training_results c on c.session_id = s.id
      where c.repetitions >= c.target_repetitions),
    'modules', case when exists(select 1 from public.initial_course_completions where user_id=p_user)
      then to_jsonb(array[1,2,3,4,5,6,7]) else coalesce(
      (select jsonb_agg(m.module order by m.module) from (select distinct module from events where kind='module_completed') m), '[]'::jsonb)
    end,
    'modulesStarted', case when exists(select 1 from public.initial_course_completions where user_id=p_user)
      then to_jsonb(array[1,2,3,4,5,6,7]) else coalesce(
      (select jsonb_agg(m.module order by m.module) from (select distinct module from events where kind='module_started') m), '[]'::jsonb)
    end,
    'frequency', coalesce((select jsonb_agg(f order by day) from frequency f), '[]'::jsonb),
    'attendance', coalesce((select jsonb_agg(a order by day desc) from recent_activity a), '[]'::jsonb),
    'points', coalesce((select jsonb_agg(p order by started_at,id) from points p), '[]'::jsonb)
  ) from allowed
$$;

create function public.pilot_directory(p_search text, p_offset integer)
returns table (user_id uuid, display_name text, last_login timestamptz, last_activity timestamptz,
  completed bigint, active_seconds bigint, camera_score integer, final_correct integer,
  final_total integer, course_completed boolean)
language sql stable security invoker set search_path = '' as $$
  with roster as (
    select r.user_id, s.last_login_at, p.display_name
    from public.pilot_roster() r join public.staff_roster() s using (user_id)
      join public.user_profiles p using (user_id)
    where coalesce(p_search,'')='' or strpos(lower(p.display_name),lower(left(p_search,80)))>0
    order by lower(p.display_name), r.user_id
    limit 26 offset greatest(0,least(20000,coalesce(p_offset,0)))
  )
  select r.user_id, r.display_name, r.last_login_at,
    (select max(last_seen_at) from public.pilot_events e where e.user_id=r.user_id and e.kind in ('visit','sign_in')),
    s.completed, s.active_seconds, c.overall_score, q.correct_count, q.question_count,
    exists(select 1 from public.initial_course_completions f where f.user_id=r.user_id)
  from roster r
  cross join lateral (
    select count(*) filter (where x.status='completed') as completed,
      coalesce(sum(x.active_seconds),0) as active_seconds from public.training_sessions x where x.user_id=r.user_id
  ) s
  left join lateral (
    select x.overall_score from public.camera_training_results x join public.training_sessions z on z.id=x.session_id
    where z.user_id=r.user_id order by x.recorded_at desc, z.id desc limit 1
  ) c on true
  left join lateral (
    select x.correct_count, x.question_count from public.knowledge_assessment_attempts x
      join public.training_sessions z on z.id=x.session_id
    where z.user_id=r.user_id and x.assessment='final' order by x.recorded_at desc,z.id desc limit 1
  ) q on true
  order by lower(r.display_name), r.user_id
$$;

create function public.pilot_cohort(p_from date, p_to date) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with bounds as (
    select p_from as day_from, p_to as day_to, (now() at time zone 'UTC')::date as today
    where p_from is not null and p_to >= p_from and p_to - p_from < 366 and p_to <= (now() at time zone 'UTC')::date
  ), roster as (
    select r.* from public.pilot_roster() r cross join bounds b where r.enrolled_at < ((b.day_to+1)::timestamp at time zone 'UTC')
  ), visits as (
    select distinct e.user_id, (e.occurred_at at time zone 'UTC')::date as day
    from public.pilot_events e join roster r using (user_id)
    where e.kind='visit' and e.occurred_at >= r.enrolled_at
  ), first_visits as (
    select user_id, min(day) as first_day from visits group by user_id
  ), period_visits as (
    select v.* from visits v cross join bounds b where v.day between b.day_from and b.day_to
  ), retention as (
    select d.offset_day, count(*) filter (where f.user_id is not null) as eligible,
      count(v.user_id) as retained
    from bounds b cross join (values (1),(7),(30)) d(offset_day)
      left join first_visits f on f.first_day between b.day_from and b.day_to
        and f.first_day + d.offset_day <= least(b.day_to, b.today-1)
      left join visits v on v.user_id=f.user_id and v.day=f.first_day+d.offset_day
    group by d.offset_day
  ), sessions as (
    select s.* from public.training_sessions s join roster r using(user_id) cross join bounds b
    where s.started_at >= greatest(r.enrolled_at, b.day_from::timestamp at time zone 'UTC')
      and s.started_at < ((b.day_to+1)::timestamp at time zone 'UTC')
  ), first_courses as (
    select f.user_id, f.completed_at from public.initial_course_completions f
    join sessions s on s.id=f.session_id cross join bounds b
    where f.completed_at < ((b.day_to+1)::timestamp at time zone 'UTC')
  ), completed as (
    select s.* from sessions s cross join bounds b where s.status='completed'
      and s.ended_at < ((b.day_to+1)::timestamp at time zone 'UTC')
  ), camera_users as (
    select distinct e.user_id from public.pilot_events e join sessions s on s.id=e.session_id
    cross join bounds b where e.kind='camera_started' and e.occurred_at < ((b.day_to+1)::timestamp at time zone 'UTC')
  ), daily as (
    select b.day_from + d.idx as day,
      (select count(*) from period_visits v where v.day = b.day_from+d.idx) as active,
      (select count(*) from completed s where (s.ended_at at time zone 'UTC')::date = b.day_from+d.idx) as completed
    from bounds b cross join lateral generate_series(0, b.day_to-b.day_from) d(idx)
  ), week_totals as (
    select date_trunc('week', d.day::timestamp)::date as week, sum(d.completed) as completed
    from daily d group by 1
  ), weekly as (
    select w.*,
      (select count(distinct v.user_id) from period_visits v
        where v.day >= w.week and v.day < w.week + 7) as active
    from week_totals w
  ), camera_trends as (
    select date_trunc('week', s.started_at at time zone 'UTC')::date as week,
      count(c.overall_score) as samples, round(avg(c.overall_score)) as score
    from sessions s join public.camera_training_results c on c.session_id=s.id cross join bounds b
    where c.recorded_at < ((b.day_to+1)::timestamp at time zone 'UTC') and c.overall_score is not null group by 1
  ), knowledge_trends as (
    select date_trunc('week', s.started_at at time zone 'UTC')::date as week,
      count(*) as samples, round(avg(100.0*q.correct_count/q.question_count)) as score
    from sessions s join public.knowledge_assessment_attempts q on q.session_id=s.id cross join bounds b
    where q.assessment='final' and q.question_count>0 and q.recorded_at < ((b.day_to+1)::timestamp at time zone 'UTC') group by 1
  )
  select jsonb_build_object(
    'registered', (select count(*) from roster),
    'courseStarted', (select count(distinct user_id) from sessions where training_type='course'),
    'firstCourseCompleted', (select count(*) from first_courses),
    'secondSession', (select count(*) from first_courses f where exists (
      select 1 from sessions s where s.user_id=f.user_id and s.started_at > f.completed_at)),
    'cameraStarted', (select count(*) from camera_users),
    'returned', (select count(distinct v.user_id) from period_visits v join first_visits f using(user_id) where v.day>f.first_day),
    'dailyActive', (select count(*) from period_visits where day=b.day_to),
    'weeklyActive', (select count(distinct user_id) from period_visits where day > b.day_to-7),
    'active', (select count(distinct user_id) from period_visits),
    'trainingParticipants', (select count(distinct user_id) from sessions),
    'completed', (select count(*) from completed),
    'activeSeconds', (select coalesce(sum(active_seconds),0) from sessions where (activity_at at time zone 'UTC')::date <= b.day_to),
    'latest', (select max(e.last_seen_at) from public.pilot_events e join roster r using(user_id)
      where e.kind in ('visit','sign_in') and e.occurred_at >= r.enrolled_at
        and (e.last_seen_at at time zone 'UTC')::date between b.day_from and b.day_to),
    'retention', coalesce((select jsonb_agg(r order by offset_day) from retention r),'[]'::jsonb),
    'daily', coalesce((select jsonb_agg(d order by day) from daily d),'[]'::jsonb),
    'weekly', coalesce((select jsonb_agg(w order by week) from weekly w),'[]'::jsonb),
    'camera', coalesce((select jsonb_agg(c order by week) from camera_trends c),'[]'::jsonb),
    'knowledge', coalesce((select jsonb_agg(k order by week) from knowledge_trends k),'[]'::jsonb)
  ) from bounds b where auth.uid() is not null and auth.jwt()->>'aal' = 'aal2'
    and public.account_access()->>'role' in ('staff','admin')
$$;

create function public.set_pilot_preferences(p_days integer default null, p_activity text default null, p_done boolean default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  current_week date := date_trunc('week',now() at time zone 'UTC')::date;
begin
  if actor is null then raise exception 'Login required' using errcode = '42501'; end if;
  if p_days is not null then
    if p_days not in (0,3,7,14,30) then raise exception 'Invalid frequency' using errcode = '22023'; end if;
    insert into public.pilot_preferences (user_id,reminder_days) values(actor,p_days)
    on conflict (user_id) do update set reminder_days=excluded.reminder_days, reminders_since=now()
      where pilot_preferences.reminder_days<>excluded.reminder_days;
  elsif p_activity in ('course','knowledge','camera','review') and p_done is not null then
    insert into public.pilot_preferences (user_id,plan_week) values(actor,current_week)
    on conflict (user_id) do nothing;
    update public.pilot_preferences set plan_week=current_week,
      plan_done=(case when plan_week=current_week then array_remove(plan_done,p_activity) else '{}'::text[] end)
        || (case when p_done then array[p_activity] else '{}'::text[] end)
    where user_id=actor;
  else
    raise exception 'Invalid preferences' using errcode='22023';
  end if;
end
$$;

create function public.submit_pilot_support(p_id uuid,p_kind text,p_message text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null) then
    raise exception 'Verified account required' using errcode='42501';
  end if;
  if p_id is null or p_kind is null or p_kind not in ('problem','help','feedback')
      or p_message is null or char_length(btrim(p_message)) not between 5 and 2000 then return false; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,113024));
  if exists(select 1 from public.pilot_support where id=p_id and user_id=actor) then return true; end if;
  if (select count(*) from public.pilot_support where user_id=actor and created_at>now()-interval '1 day') >= 10 then
    return false;
  end if;
  insert into public.pilot_support(id,user_id,kind,message)
    values(p_id,actor,p_kind,btrim(p_message)) on conflict (id) do nothing;
  return found;
end
$$;

create function public.update_pilot_support(p_id uuid,p_status text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not corcpr_private.is_elevated('admin') then
    raise exception 'Admin and MFA required' using errcode='42501';
  end if;
  if p_status is null or p_status not in ('open','reviewing','resolved') then return false; end if;
  update public.pilot_support set status=p_status, updated_at=now() where id=p_id and status<>p_status;
  return found or exists(select 1 from public.pilot_support where id=p_id and status=p_status);
end
$$;

revoke all on function public.record_pilot_event(uuid,text,uuid,integer) from public, anon, authenticated, service_role;
grant execute on function public.record_pilot_event(uuid,text,uuid,integer) to service_role;
revoke all on function public.set_pilot_enrollment(boolean), public.pilot_roster(), public.pilot_progress(uuid), public.pilot_directory(text,integer),
  public.pilot_cohort(date,date), public.set_pilot_preferences(integer,text,boolean),
  public.submit_pilot_support(uuid,text,text), public.update_pilot_support(uuid,text) from public, anon, authenticated, service_role;
grant execute on function public.set_pilot_enrollment(boolean), public.pilot_roster(), public.pilot_progress(uuid), public.pilot_directory(text,integer),
  public.pilot_cohort(date,date), public.set_pilot_preferences(integer,text,boolean),
  public.submit_pilot_support(uuid,text,text), public.update_pilot_support(uuid,text) to authenticated;
notify pgrst, 'reload schema';

commit;
