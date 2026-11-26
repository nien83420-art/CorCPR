begin;

create or replace function public.manage_staff_access(p_operation text, p_target uuid, p_student uuid default null) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not corcpr_private.is_elevated('admin') then
    raise exception 'Admin and MFA required' using errcode = '42501';
  end if;
  -- Serialize permission changes with the invitee accepting their invitation.
  if p_operation <> 'revoke_invite' and p_target is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_target::text, 421769));
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

create or replace function public.respond_to_staff_invitation(p_invitation uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  invite public.staff_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'Invitation unavailable' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 421769));
  select * into invite from public.staff_invitations
    where id = p_invitation and invitee_id = auth.uid() and status = 'pending' and expires_at > now() for update;
  if not found or p_accept is null then raise exception 'Invitation unavailable' using errcode = '42501'; end if;
  if p_accept then
    insert into public.account_roles (user_id, role) values (auth.uid(), 'staff') on conflict (user_id) do nothing;
  end if;
  update public.staff_invitations set status = case when p_accept then 'accepted' else 'declined' end
    where id = invite.id;
end $$;

commit;
