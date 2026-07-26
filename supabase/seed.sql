-- Synthetic hackathon fixture only. Never replace these rows with real health data.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone, phone_change, phone_change_token, email_change_token_current,
  reauthentication_token, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'preseed-demo@example.invalid',
  crypt('synthetic-demo-only', gen_salt('bf')), now(),
  '', '', '', '', null, '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Synthetic PreSeed Demo"}'::jsonb,
  now(), now()
) on conflict (id) do update set
  raw_user_meta_data = excluded.raw_user_meta_data,
  confirmation_token = '', recovery_token = '', email_change_token_new = '',
  email_change = '', phone_change = '', phone_change_token = '',
  email_change_token_current = '', reauthentication_token = '',
  updated_at = now();

update public.profiles set
  fertility_track = 'general',
  onboarding_data = '{
    "synthetic": true,
    "tryingToConceive": true,
    "smoking": false,
    "alcoholUnitsWeekly": 8,
    "sleepHours": 6,
    "exerciseSessionsWeekly": 5,
    "heatExposure": "frequent",
    "occupationalExposure": "traffic_pollution",
    "supplements": []
  }'::jsonb,
  onboarding_completed_at = now(),
  health_data_consented_at = now()
where id = '10000000-0000-4000-8000-000000000001';

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.clinical_tests (
  id, user_id, test_type, source, collected_at, lab_name,
  abstinence_hours, collection_complete, recent_fever, notes
) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'semen_analysis', 'simulated', '2026-04-15T09:00:00Z', 'Synthetic Reference Laboratory',
   72, true, false, 'Synthetic baseline fixture; not a real laboratory result.'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001',
   'semen_analysis', 'simulated', '2026-07-20T09:00:00Z', 'Synthetic Reference Laboratory',
   60, true, false, 'Synthetic retest fixture; not a real laboratory result.'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001',
   'hormone_panel', 'simulated', '2026-07-21T08:00:00Z', 'Synthetic Endocrine Laboratory',
   null, null, false, 'Synthetic hormone fixture; assay intervals are illustrative.')
on conflict (id) do update set
  collected_at = excluded.collected_at,
  abstinence_hours = excluded.abstinence_hours,
  collection_complete = excluded.collection_complete,
  recent_fever = excluded.recent_fever,
  notes = excluded.notes;

insert into public.clinical_markers (
  test_id, user_id, code, numeric_value, unit,
  reference_low, reference_high, verification
) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'volume_ml', 2.0, 'mL', 1.4, null, 'lab_report'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'concentration_million_ml', 12, 'million/mL', 16, null, 'lab_report'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'progressive_motility_pct', 24, '%', 30, null, 'lab_report'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'total_motility_pct', 34, '%', 42, null, 'lab_report'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'normal_morphology_pct', 3, '%', 4, null, 'lab_report'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'volume_ml', 2.2, 'mL', 1.4, null, 'lab_report'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'concentration_million_ml', 14, 'million/mL', 16, null, 'lab_report'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'progressive_motility_pct', 28, '%', 30, null, 'lab_report'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'total_motility_pct', 39, '%', 42, null, 'lab_report'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'normal_morphology_pct', 4, '%', 4, null, 'lab_report'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'dna_fragmentation_pct', 32, '%', null, 25, 'lab_report'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'seminal_leukocytes_million_ml', 1.2, 'million/mL', null, 1.0, 'lab_report'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'fsh_iu_l', 11.8, 'IU/L', 1.5, 12.4, 'lab_report'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'lh_iu_l', 7.9, 'IU/L', 1.7, 8.6, 'lab_report'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'total_testosterone_nmol_l', 10.2, 'nmol/L', 8.6, 29.0, 'lab_report')
on conflict (test_id, code) do update set
  numeric_value = excluded.numeric_value,
  unit = excluded.unit,
  reference_low = excluded.reference_low,
  reference_high = excluded.reference_high,
  verification = excluded.verification;

commit;
