begin;

create schema corcpr_private;

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  sharing_enabled_at timestamptz
);

create table public.account_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('staff', 'admin')),
  granted_at timestamptz not null default now()
);

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  invitee_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked'))
);
create unique index staff_pending_invitation on public.staff_invitations (invitee_id) where status = 'pending';

create table public.staff_student_assignments (
  staff_id uuid references auth.users(id) on delete cascade,
  student_id uuid references auth.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (staff_id, student_id),
  check (staff_id <> student_id)
);
create index staff_assignments_student on public.staff_student_assignments (student_id) where revoked_at is null;

create table public.training_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  training_type text not null check (training_type in ('course', 'camera')),
  status text not null default 'in_progress' check (status in ('in_progress', 'interrupted', 'completed')),
  started_at timestamptz not null default now(),
  activity_at timestamptz not null default now(),
  ended_at timestamptz,
  active_seconds integer not null default 0 check (active_seconds between 0 and 86400),
  unique (user_id, id),
  check ((ended_at is null) = (status = 'in_progress')),
  check (ended_at is null or ended_at >= started_at)
);
create index training_sessions_recent on public.training_sessions (user_id, started_at desc);

create table public.camera_training_results (
  session_id uuid primary key references public.training_sessions(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  repetitions integer not null check (repetitions between 0 and 30),
  target_repetitions integer not null check (target_repetitions = 30),
  last_cadence integer check (last_cadence between 1 and 400),
  camera_seconds integer not null check (camera_seconds between 1 and 86400),
  technique_score integer check (technique_score between 0 and 100),
  rhythm_score integer check (rhythm_score between 0 and 100),
  completion_score integer not null check (completion_score between 0 and 100),
  overall_score integer check (overall_score between 0 and 100),
  rating text not null check (rating in ('excellent','good','needsWork')),
  tips text[] not null default '{}'
);

create table public.knowledge_assessment_attempts (
  session_id uuid references public.training_sessions(id) on delete cascade,
  assessment text check (assessment in ('intro', 'final')),
  recorded_at timestamptz not null default now(),
  correct_count integer not null check (correct_count >= 0),
  question_count integer not null check (question_count between 1 and 24),
  primary key (session_id, assessment),
  check (correct_count <= question_count)
);

create table public.knowledge_assessment_answers (
  session_id uuid not null,
  assessment text not null,
  question_id text not null check (char_length(question_id) between 1 and 40),
  is_correct boolean not null,
  response jsonb not null check (jsonb_typeof(response) in ('number','object')),
  primary key (session_id, assessment, question_id),
  foreign key (session_id, assessment) references public.knowledge_assessment_attempts(session_id, assessment) on delete cascade
);

create table public.self_assessments (
  session_id uuid primary key references public.training_sessions(id) on delete cascade,
  initial_confidence integer not null check (initial_confidence between 1 and 5),
  final_confidence integer check (final_confidence between 1 and 5)
);

create table public.learning_progress (
  session_id uuid primary key references public.training_sessions(id) on delete cascade,
  curriculum_version integer not null default 1 check (curriculum_version = 1),
  preparation_verified_at timestamptz not null default now(),
  final_assessment_at timestamptz
);

create table public.initial_course_completions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_id uuid not null,
  completed_at timestamptz not null default now(),
  foreign key (user_id, session_id) references public.training_sessions(user_id, id) on delete cascade
);

create table public.account_deletion_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now()
);

create function corcpr_private.role_of(p_user uuid) returns text
language sql stable security definer set search_path = ''
as $$ select coalesce((select role from public.account_roles where user_id = p_user), 'student') $$;

create function corcpr_private.is_elevated(p_role text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and coalesce(auth.jwt()->>'aal', '') = 'aal2'
    and corcpr_private.role_of(auth.uid()) = p_role
$$;

create function corcpr_private.can_view_student(p_student uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and (
    auth.uid() = p_student
    or (
      corcpr_private.role_of(p_student) = 'student'
      and exists (select 1 from public.user_profiles where user_id = p_student and sharing_enabled_at is not null)
      and (
        corcpr_private.is_elevated('admin')
        or (
          corcpr_private.is_elevated('staff')
          and exists (
            select 1 from public.staff_student_assignments
            where staff_id = auth.uid() and student_id = p_student and revoked_at is null
          )
        )
      )
    )
  )
$$;

create function corcpr_private.can_view_session(p_session uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.training_sessions where id = p_session
      and corcpr_private.can_view_student(user_id)
  )
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'user_profiles', 'account_roles', 'staff_invitations', 'staff_student_assignments',
    'training_sessions', 'camera_training_results', 'knowledge_assessment_attempts',
    'knowledge_assessment_answers', 'self_assessments', 'learning_progress',
    'initial_course_completions', 'account_deletion_requests'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', t);
    execute format('grant select on table public.%I to authenticated', t);
  end loop;
end $$;

create policy profiles_reader on public.user_profiles for select to authenticated
  using (corcpr_private.can_view_student(user_id));
create policy roles_reader on public.account_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select corcpr_private.is_elevated('admin')));
create policy invitations_reader on public.staff_invitations for select to authenticated
  using (invitee_id = (select auth.uid()) or (select corcpr_private.is_elevated('admin')));
create policy assignments_reader on public.staff_student_assignments for select to authenticated
  using ((select corcpr_private.is_elevated('admin')) or
    (staff_id = (select auth.uid()) and revoked_at is null and corcpr_private.can_view_student(student_id)) or
    student_id = (select auth.uid()));
create policy sessions_reader on public.training_sessions for select to authenticated
  using (corcpr_private.can_view_student(user_id));
create policy camera_reader on public.camera_training_results for select to authenticated
  using (corcpr_private.can_view_session(session_id));
create policy assessments_reader on public.knowledge_assessment_attempts for select to authenticated
  using (corcpr_private.can_view_session(session_id));
create policy answers_reader on public.knowledge_assessment_answers for select to authenticated
  using (corcpr_private.can_view_session(session_id));
create policy confidence_reader on public.self_assessments for select to authenticated
  using (corcpr_private.can_view_session(session_id));
create policy learning_reader on public.learning_progress for select to authenticated
  using (corcpr_private.can_view_session(session_id));
create policy completions_reader on public.initial_course_completions for select to authenticated
  using (corcpr_private.can_view_student(user_id));
create policy deletion_reader on public.account_deletion_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select corcpr_private.is_elevated('admin')));

create function public.account_access() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'role', r.role,
    'mfaRequired', r.role <> 'student' and coalesce(auth.jwt()->>'aal', '') <> 'aal2',
    'courseCompleted', exists (select 1 from public.initial_course_completions where user_id = auth.uid()),
    'canSkip', case when r.role = 'student' then exists (
      select 1 from public.initial_course_completions where user_id = auth.uid()
    ) else coalesce(auth.jwt()->>'aal', '') = 'aal2' end
  ) from (select corcpr_private.role_of(auth.uid()) as role) r where auth.uid() is not null
$$;

create function public.update_account_profile(p_name text, p_share boolean) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or p_name is null or length(trim(p_name)) > 80 or p_share is null then
    raise exception 'Invalid profile request' using errcode = '22023';
  end if;
  insert into public.user_profiles (user_id, display_name, sharing_enabled_at)
  values (auth.uid(), trim(p_name), case when p_share then now() end)
  on conflict (user_id) do update set display_name = excluded.display_name,
    sharing_enabled_at = case when p_share then coalesce(user_profiles.sharing_enabled_at, now()) end;
end $$;

create function public.request_account_deletion() returns void
language sql security definer set search_path = ''
as $$
  insert into public.account_deletion_requests(user_id) values (auth.uid()) on conflict do nothing
$$;

create function public.staff_roster()
returns table (user_id uuid, last_login_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select p.user_id, u.last_sign_in_at
  from public.user_profiles p join auth.users u on u.id = p.user_id
  where p.user_id <> auth.uid() and corcpr_private.can_view_student(p.user_id)
    and (corcpr_private.is_elevated('staff') or corcpr_private.is_elevated('admin'))
$$;

create function public.manage_staff_access(p_operation text, p_target uuid, p_student uuid default null) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not corcpr_private.is_elevated('admin') then
    raise exception 'Admin and MFA required' using errcode = '42501';
  end if;
  case p_operation
    when 'invite' then
      if p_target is null or corcpr_private.role_of(p_target) <> 'student' or not exists (
        select 1 from auth.users where id = p_target and email_confirmed_at is not null
      ) then
        raise exception 'Eligible verified account required' using errcode = '22023';
      end if;
      update public.staff_invitations set status = 'revoked'
        where invitee_id = p_target and status = 'pending' and expires_at <= now();
      insert into public.staff_invitations (invitee_id, invited_by) values (p_target, auth.uid())
        on conflict (invitee_id) where status = 'pending' do nothing;
    when 'revoke_invite' then
      update public.staff_invitations set status = 'revoked' where id = p_target and status = 'pending';
    when 'revoke_staff' then
      delete from public.account_roles where user_id = p_target and role = 'staff';
      update public.staff_student_assignments set revoked_at = now() where staff_id = p_target and revoked_at is null;
      update public.staff_invitations set status = 'revoked' where invitee_id = p_target and status = 'pending';
    when 'assign' then
      -- Lock the role row so revocation and assignment cannot leave a live orphaned relationship.
      perform 1 from public.account_roles where user_id = p_target and role = 'staff' for update;
      if not found or p_student is null or corcpr_private.role_of(p_student) <> 'student' then
        raise exception 'Staff and student required' using errcode = '22023';
      end if;
      insert into public.staff_student_assignments (staff_id, student_id) values (p_target, p_student)
      on conflict (staff_id, student_id) do update set assigned_at = now(), revoked_at = null
      where staff_student_assignments.revoked_at is not null;
    when 'unassign' then
      update public.staff_student_assignments set revoked_at = now()
        where staff_id = p_target and student_id = p_student and revoked_at is null;
    else raise exception 'Unknown operation' using errcode = '22023';
  end case;
end $$;

create function public.respond_to_staff_invitation(p_invitation uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  invite public.staff_invitations%rowtype;
begin
  select * into invite from public.staff_invitations
    where id = p_invitation and invitee_id = auth.uid() and status = 'pending' and expires_at > now() for update;
  if not found or p_accept is null then raise exception 'Invitation unavailable' using errcode = '42501'; end if;
  if p_accept then
    insert into public.account_roles (user_id, role) values (auth.uid(), 'staff') on conflict (user_id) do nothing;
  end if;
  update public.staff_invitations set status = case when p_accept then 'accepted' else 'declined' end
    where id = invite.id;
end $$;

revoke all on all functions in schema corcpr_private from public, anon, authenticated, service_role;
grant execute on function corcpr_private.can_view_student(uuid), corcpr_private.can_view_session(uuid),
  corcpr_private.is_elevated(text) to authenticated;
-- Schema usage stays private to prevent calling helpers through the public Data API.
revoke all on function public.account_access(), public.update_account_profile(text,boolean),
  public.request_account_deletion(), public.staff_roster(), public.manage_staff_access(text,uuid,uuid),
  public.respond_to_staff_invitation(uuid,boolean) from public, anon, authenticated, service_role;
grant execute on function public.account_access(), public.update_account_profile(text,boolean),
  public.request_account_deletion(), public.staff_roster(), public.manage_staff_access(text,uuid,uuid),
  public.respond_to_staff_invitation(uuid,boolean) to authenticated;

commit;
