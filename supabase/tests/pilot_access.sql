begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(28);

insert into auth.users(id,email,email_confirmed_at,created_at,updated_at) values
('bb000000-0000-4000-8000-000000000001','pilot-a@example.test',now()-interval '40 days',now()-interval '40 days',now()),
('bb000000-0000-4000-8000-000000000002','pilot-b@example.test',now(),now(),now()),
('bb000000-0000-4000-8000-000000000003','pilot-staff@example.test',now(),now(),now()),
('bb000000-0000-4000-8000-000000000004','pilot-admin@example.test',now(),now(),now());
insert into account_roles(user_id,role) values ('bb000000-0000-4000-8000-000000000003','staff'), ('bb000000-0000-4000-8000-000000000004','admin');
insert into user_profiles(user_id,display_name,sharing_enabled_at) values
('bb000000-0000-4000-8000-000000000001','Pilot A',now()),
('bb000000-0000-4000-8000-000000000002','Pilot B',now());
insert into staff_student_assignments(staff_id,student_id)
values('bb000000-0000-4000-8000-000000000003','bb000000-0000-4000-8000-000000000001');
insert into pilot_enrollments(user_id,enrolled_at) values
('bb000000-0000-4000-8000-000000000001',now()-interval '40 days'),
('bb000000-0000-4000-8000-000000000002',now()-interval '1 hour');

insert into training_sessions(id,user_id,training_type,started_at,activity_at,ended_at,status,active_seconds)
values ('bc000000-0000-4000-8000-000000000001','bb000000-0000-4000-8000-000000000001','course',
now()-interval '9 days',now()-interval '9 days'+interval '4 minutes',now()-interval '9 days'+interval '4 minutes','completed',180);
insert into initial_course_completions(user_id,session_id,completed_at)
values ('bb000000-0000-4000-8000-000000000001','bc000000-0000-4000-8000-000000000001',now()-interval '9 days'+interval '4 minutes');
insert into training_sessions(id,user_id,training_type)
values ('bc000000-0000-4000-8000-000000000002','bb000000-0000-4000-8000-000000000001','course');

insert into pilot_events(user_id,event_key,kind,occurred_at,last_seen_at)
select 'bb000000-0000-4000-8000-000000000001', 'fixture-visit-'||d, 'visit', now()-make_interval(days=>d), now()-make_interval(days=>d)
from (values (10),(9),(3)) x(d);
select ok(record_pilot_event('bb000000-0000-4000-8000-000000000001','visit'),'authenticated visit recorded');
select ok(record_pilot_event('bb000000-0000-4000-8000-000000000001','visit'),'refresh is accepted idempotently');
select is((select count(*) from pilot_events where kind='visit' and occurred_at>now()-interval '1 minute'),1::bigint,'refresh creates one attendance record');
select ok(not record_pilot_event('bb000000-0000-4000-8000-000000000001','module_completed','bc000000-0000-4000-8000-000000000002',2),'cannot skip a lesson milestone');
select ok(not record_pilot_event('bb000000-0000-4000-8000-000000000002','module_started','bc000000-0000-4000-8000-000000000002',1),'cannot record another learner session');
select ok(record_pilot_event('bb000000-0000-4000-8000-000000000001','module_started','bc000000-0000-4000-8000-000000000002',1),'lesson start recorded');
select ok(record_pilot_event('bb000000-0000-4000-8000-000000000001','module_completed','bc000000-0000-4000-8000-000000000002',1),'lesson completion recorded');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"bb000000-0000-4000-8000-000000000001","aal":"aal1"}',true);
select is(pilot_progress(auth.uid())->>'trainingDays','1','learner sees real training days');
select is(pilot_progress('bb000000-0000-4000-8000-000000000002'), null::jsonb,'learner cannot see unrelated progress');
select is(pilot_cohort((now() at time zone 'UTC')::date-20,(now() at time zone 'UTC')::date),null::jsonb,'learner cannot see cohort');
do $$begin perform set_pilot_preferences(7); perform set_pilot_preferences(null,'camera',true); end$$;
select is((select reminder_days from pilot_preferences where user_id=auth.uid()),7::smallint,'reminder setting persists');
select is((select plan_done from pilot_preferences where user_id=auth.uid()),array['camera']::text[],'optional plan mark persists');
select ok(submit_pilot_support('bd000000-0000-4000-8000-000000000001','help','Synthetic support request'),'support request persisted');
select ok(submit_pilot_support('bd000000-0000-4000-8000-000000000001','help','Synthetic support request'),'support retry succeeds');
select is((select count(*) from pilot_support),1::bigint,'retry does not duplicate support');

select set_config('request.jwt.claims','{"sub":"bb000000-0000-4000-8000-000000000003","aal":"aal1"}',true);
select is((select count(*) from pilot_roster()),0::bigint,'AAL1 staff cannot read roster');
select is(pilot_cohort((now() at time zone 'UTC')::date-20,(now() at time zone 'UTC')::date),null::jsonb,'AAL1 staff cannot read analytics');
select set_config('request.jwt.claims','{"sub":"bb000000-0000-4000-8000-000000000003","aal":"aal2"}',true);
select is((select count(*) from pilot_directory('',0)),1::bigint,'AAL2 staff sees only assigned consenting enrolled learners');
select is(pilot_progress('bb000000-0000-4000-8000-000000000002'),null::jsonb,'unassigned pilot details hidden');
select is((select jsonb_path_query_first(pilot_cohort((now() at time zone 'UTC')::date-20,(now() at time zone 'UTC')::date),'$.retention[*] ? (@.offset_day == 7).retained')::text),'1','D7 includes an observed return');
select is((select jsonb_path_query_first(pilot_cohort((now() at time zone 'UTC')::date-20,(now() at time zone 'UTC')::date),'$.retention[*] ? (@.offset_day == 30).eligible')::text),'0','D30 excludes unobserved users');
select is((select count(*) from pilot_support),0::bigint,'instructor cannot read student support requests');
select set_config('request.jwt.claims','{"sub":"bb000000-0000-4000-8000-000000000004","aal":"aal1"}',true);
select throws_ok($$select update_pilot_support('bd000000-0000-4000-8000-000000000001','resolved')$$,
  '42501','Admin and MFA required','AAL1 admin cannot update support');
select set_config('request.jwt.claims','{"sub":"bb000000-0000-4000-8000-000000000004","aal":"aal2"}',true);
select is((select count(*) from pilot_support),1::bigint,'AAL2 admin sees support queue');
select ok(update_pilot_support('bd000000-0000-4000-8000-000000000001','resolved'),'admin can resolve support');
select set_config('request.jwt.claims','{"sub":"bb000000-0000-4000-8000-000000000001","aal":"aal1"}',true);
select is((select status from pilot_support),'resolved','learner sees own updated support status');
select ok(not set_pilot_enrollment(false),'learner opts out');
select set_config('request.jwt.claims','{"sub":"bb000000-0000-4000-8000-000000000003","aal":"aal2"}',true);
select is((select count(*) from pilot_directory('',0)),0::bigint,'withdrawing hides the learner from pilot staff');
select * from finish();
rollback;
