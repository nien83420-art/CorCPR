begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, email, email_confirmed_at, created_at, updated_at)
select (format('aa000000-0000-4000-8000-00000000000%s', n))::uuid,
  'corcpr-sql-' || n || '@example.test', now(), now(), now()
from generate_series(1,5) n;

insert into public.user_profiles(user_id, display_name, sharing_enabled_at) values
  ('aa000000-0000-4000-8000-000000000001','Student A',now()),
  ('aa000000-0000-4000-8000-000000000002','Student B',now());
insert into public.account_roles (user_id, role) values
  ('aa000000-0000-4000-8000-000000000003','staff'),
  ('aa000000-0000-4000-8000-000000000004','staff'),
  ('aa000000-0000-4000-8000-000000000005','admin');
insert into public.staff_student_assignments (staff_id, student_id) values
  ('aa000000-0000-4000-8000-000000000003','aa000000-0000-4000-8000-000000000001'),
  ('aa000000-0000-4000-8000-000000000004','aa000000-0000-4000-8000-000000000002');

set local role service_role;
select throws_ok($$select begin_training('aa000000-0000-4000-8000-000000000001',
  'bb000000-0000-4000-8000-000000000001','camera',false)$$,
  '42501','Complete the initial course first','Incomplete student cannot start a camera-only run');
select throws_ok($$select begin_training('aa000000-0000-4000-8000-000000000003',
  'bb000000-0000-4000-8000-000000000003','camera',false)$$,
  '42501','Complete the initial course first','Staff without MFA cannot bypass');
select lives_ok($$select begin_training('aa000000-0000-4000-8000-000000000003',
  'bb000000-0000-4000-8000-000000000003','camera',true)$$,'MFA staff can start camera practice');
select lives_ok($$select begin_training('aa000000-0000-4000-8000-000000000001',
  'bb000000-0000-4000-8000-000000000001','course',false)$$,'Student can start the full course');
select lives_ok($$select begin_training('aa000000-0000-4000-8000-000000000002',
  'bb000000-0000-4000-8000-000000000002','course',false)$$,'Second student can start the full course');
select throws_ok($$select write_training('aa000000-0000-4000-8000-000000000001',
  'bb000000-0000-4000-8000-000000000001','course',now(),0,'{}','{}','{}',false)$$,
  '42501','Required course checkpoints are missing','Final result cannot bypass course checkpoints');
select lives_ok($$select training_heartbeat('aa000000-0000-4000-8000-000000000002',
  'bb000000-0000-4000-8000-000000000002',0,true)$$,'An interrupted run is recorded');

create temporary table test_results (camera jsonb, prep jsonb, final jsonb);
insert into test_results values (
  '{"totalCompressions":30,"targetCompressions":30,"averageBpm":110,"durationSeconds":60,"techniqueScore":80,"rhythmScore":90,"completionScore":100,"overallScore":87,"rating":"excellent","tips":[]}'::jsonb
    || jsonb_build_object('finishedAt', now() - interval '2 minutes'),
  '{"confidence":2,"answers":[{"question":"intro-0","isCorrect":false,"response":1}]}',
  '{"confidence":4,"answers":[{"question":"final-0","isCorrect":true,"response":0}]}'::jsonb
    || jsonb_build_object('finishedAt', now() - interval '1 minute')
);
select lives_ok($$select write_training('aa000000-0000-4000-8000-000000000001',
  'bb000000-0000-4000-8000-000000000004','course',now() - interval '3 minutes',60,camera,prep,final,true) from test_results$$,
  'An eligible guest result is claimed transactionally');
select lives_ok($$select write_training('aa000000-0000-4000-8000-000000000001',
  'bb000000-0000-4000-8000-000000000004','course',now() - interval '3 minutes',60,camera,prep,final,true) from test_results$$,
  'A retry is idempotent');
select throws_ok($$select write_training('aa000000-0000-4000-8000-000000000002',
  'bb000000-0000-4000-8000-000000000004','course',now() - interval '3 minutes',60,camera,prep,final,true) from test_results$$,
  '42501','Training session unavailable','Another user cannot take the same guest session');
select lives_ok($$select begin_training('aa000000-0000-4000-8000-000000000001',
  'bb000000-0000-4000-8000-000000000005','camera',false)$$,'Completed student can start camera practice');

set local role authenticated;
do $$ begin perform set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000001","aal":"aal1"}',true); end $$;
select is((select count(*) from training_sessions), 3::bigint, 'Student A only reads their own session rows');
select is((select count(*) from camera_training_results), 1::bigint, 'Guest retries never duplicate results');
select is((select overall_score from camera_training_results), 87, 'Existing camera score is preserved');
select is((select recorded_at from camera_training_results), now() - interval '2 minutes',
  'Camera finish time is preserved before signup');
select is((select ended_at from training_sessions where status='completed'), now() - interval '1 minute',
  'Guest course finish time is preserved before signup');
select is((select completed_at from initial_course_completions), now() - interval '1 minute',
  'The first course timestamp agrees with the guest session');

select is((select correct_count from knowledge_assessment_attempts where assessment='final'), 1, 'Knowledge result is independently stored');
select is(account_access()->>'canSkip', 'true', 'Course completion flag is derived from a database record');
select is((select count(*) from training_sessions where user_id = 'aa000000-0000-4000-8000-000000000002'), 0::bigint,
  'Student A cannot select Student B’s session directly');
select throws_ok($$insert into account_roles(user_id,role) values(auth.uid(),'admin')$$,
  '42501','permission denied for table account_roles','A student cannot manipulate roles');
select throws_ok($$select manage_staff_access('assign','aa000000-0000-4000-8000-000000000003','aa000000-0000-4000-8000-000000000002')$$,
  '42501','Admin and MFA required','A student cannot invoke the admin RPC');
select throws_ok($$select begin_training(auth.uid(),gen_random_uuid(),'camera',true)$$,
  '42501','permission denied for function begin_training','Student cannot invoke the writer RPC');
select throws_ok($$insert into initial_course_completions (user_id,session_id) values(auth.uid(),gen_random_uuid())$$,
  '42501','permission denied for table initial_course_completions','Student cannot unlock the shortcut by writing a completion');

do $$ begin perform set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000002","aal":"aal1"}',true); end $$;
select is((select count(*) from training_sessions where status='interrupted'), 1::bigint, 'Student B sees their interruption');
select is((select count(*) from camera_training_results), 0::bigint, 'Student B cannot read A’s camera results');
select is((select count(*) from knowledge_assessment_answers), 0::bigint, 'Student B cannot read A’s answers');

do $$ begin perform set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000003","aal":"aal2"}',true); end $$;
select is((select count(*) from staff_directory('',0)), 1::bigint, 'Staff A has one assigned student');
select is((select count(*) from training_sessions where user_id='aa000000-0000-4000-8000-000000000002'), 0::bigint,
  'Staff A cannot read exclusively assigned Student B');
select is((select count(*) from camera_training_results), 1::bigint, 'Staff A reads assigned, shared camera results');
select throws_ok($$select manage_staff_access('invite','aa000000-0000-4000-8000-000000000002')$$,
  '42501','Admin and MFA required','Staff cannot provision staff access');

do $$ begin perform set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000004","aal":"aal2"}',true); end $$;
select is((select display_name from staff_directory('',0)), 'Student B', 'Staff B sees their own assigned student');
select is((select count(*) from camera_training_results), 0::bigint, 'Staff B cannot read Student A’s result');

do $$ begin perform set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000005","aal":"aal1"}',true); end $$;
select throws_ok($$select manage_staff_access('unassign','aa000000-0000-4000-8000-000000000003','aa000000-0000-4000-8000-000000000001')$$,
  '42501','Admin and MFA required','Admin without MFA has no privileged write access');
select is((select count(*) from staff_roster()), 0::bigint, 'Admin without MFA has no roster access');

do $$ begin perform set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000005","aal":"aal2"}',true); end $$;
select lives_ok($$select manage_staff_access('unassign','aa000000-0000-4000-8000-000000000003','aa000000-0000-4000-8000-000000000001')$$,
  'Admin with MFA can revoke access');
select lives_ok($$select manage_staff_access('invite','aa000000-0000-4000-8000-000000000002')$$,
  'Admin with MFA can invite a verified account');

do $$ begin perform set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000003","aal":"aal2"}',true); end $$;
select is((select count(*) from camera_training_results), 0::bigint, 'Revocation immediately removes access with the same JWT claims');
select is((select count(*) from staff_roster()), 0::bigint, 'Revoked student disappears from staff roster');

do $$ begin perform set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000001","aal":"aal1"}',true); end $$;
select is((select count(*) from staff_invitations), 0::bigint, 'A student cannot see another student’s invitation');
select lives_ok($$select update_account_profile('Student A',false)$$,'Student can turn off sharing');

do $$ begin perform set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000005","aal":"aal2"}',true); end $$;
select lives_ok($$select manage_staff_access('assign','aa000000-0000-4000-8000-000000000003','aa000000-0000-4000-8000-000000000001')$$,
  'Admin can establish a second assignment');
select is((select count(*) from staff_roster() where user_id in (
  'aa000000-0000-4000-8000-000000000001','aa000000-0000-4000-8000-000000000002'
)), 1::bigint, 'Even admin does not read withdrawn sharing data');

do $$ begin perform set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000002","aal":"aal1"}',true); end $$;
select lives_ok($$select respond_to_staff_invitation(id,true) from staff_invitations$$,'Only the invitee can accept the pending invitation');
select is(account_access()->>'role', 'staff', 'Invite acceptance yields the protected staff role');
select is(account_access()->>'mfaRequired', 'true', 'New staff must set up MFA');

select * from finish();
rollback;
