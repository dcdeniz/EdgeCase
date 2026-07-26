alter table public.clinical_markers drop constraint clinical_markers_code_check;
alter table public.clinical_markers add constraint clinical_markers_code_check check (code in (
  'volume_ml', 'concentration_million_ml', 'total_count_million',
  'total_motile_count_million', 'progressive_motile_count_million',
  'progressive_motility_pct', 'total_motility_pct', 'normal_morphology_pct',
  'dna_fragmentation_pct', 'seminal_leukocytes_million_ml',
  'fsh_iu_l', 'lh_iu_l', 'total_testosterone_nmol_l',
  'free_testosterone_nmol_l', 'estradiol_pmol_l', 'prolactin_miu_l',
  'shbg_nmol_l', 'tsh_miu_l'
));

create or replace function public.enforce_clinical_marker_metadata()
returns trigger language plpgsql set search_path = '' as $$
declare v_test_type text; v_expected_test_type text; v_expected_unit text;
begin
  select test_type into v_test_type from public.clinical_tests where id = new.test_id and user_id = new.user_id;
  select expected_test_type, expected_unit into v_expected_test_type, v_expected_unit
  from (values
    ('volume_ml', 'semen_analysis', 'mL'),
    ('concentration_million_ml', 'semen_analysis', 'million/mL'),
    ('total_count_million', 'semen_analysis', 'million'),
    ('total_motile_count_million', 'semen_analysis', 'million'),
    ('progressive_motile_count_million', 'semen_analysis', 'million'),
    ('progressive_motility_pct', 'semen_analysis', '%'),
    ('total_motility_pct', 'semen_analysis', '%'),
    ('normal_morphology_pct', 'semen_analysis', '%'),
    ('dna_fragmentation_pct', 'semen_analysis', '%'),
    ('seminal_leukocytes_million_ml', 'semen_analysis', 'million/mL'),
    ('fsh_iu_l', 'hormone_panel', 'IU/L'), ('lh_iu_l', 'hormone_panel', 'IU/L'),
    ('total_testosterone_nmol_l', 'hormone_panel', 'nmol/L'),
    ('free_testosterone_nmol_l', 'hormone_panel', 'nmol/L'),
    ('estradiol_pmol_l', 'hormone_panel', 'pmol/L'),
    ('prolactin_miu_l', 'hormone_panel', 'mIU/L'),
    ('shbg_nmol_l', 'hormone_panel', 'nmol/L'), ('tsh_miu_l', 'hormone_panel', 'mIU/L')
  ) as metadata(code, expected_test_type, expected_unit) where code = new.code;
  if v_test_type is null or v_test_type is distinct from v_expected_test_type or new.unit is distinct from v_expected_unit then
    raise exception using errcode = '23514', message = 'clinical marker does not match its test type and canonical unit';
  end if;
  return new;
end;
$$;

create table public.semen_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null check (version > 0),
  source_test_ids uuid[] not null check (cardinality(source_test_ids) between 1 and 10),
  measurements jsonb not null check (jsonb_typeof(measurements) = 'array'),
  synthesis jsonb not null check (jsonb_typeof(synthesis) = 'object'),
  evidence_ids text[] not null check (cardinality(evidence_ids) between 1 and 8),
  response_model text not null,
  embedding_model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  unique (user_id, version), unique (id, user_id)
);
create index semen_profiles_user_version_idx on public.semen_profiles (user_id, version desc);
alter table public.semen_profiles enable row level security;
create policy semen_profiles_select_own on public.semen_profiles for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.semen_profiles from anon;
grant select on public.semen_profiles to authenticated;
grant select, insert on public.semen_profiles to service_role;

create function public.create_semen_profile_artifact(
  p_user_id uuid, p_source_test_ids uuid[], p_measurements jsonb, p_synthesis jsonb,
  p_evidence_ids text[], p_response_model text, p_embedding_model text, p_prompt_version text
) returns table (id uuid, version integer, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := (select auth.uid()); v_version integer; v_id uuid; v_created timestamptz;
begin
  if v_caller is distinct from p_user_id and (select auth.role()) <> 'service_role' then raise exception 'user mismatch'; end if;
  if exists (select 1 from unnest(p_source_test_ids) test_id where not exists (
    select 1 from public.clinical_tests where clinical_tests.id = test_id and clinical_tests.user_id = p_user_id
  )) then raise exception 'source test does not belong to user'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 1));
  select coalesce(max(semen_profiles.version), 0) + 1 into v_version from public.semen_profiles where user_id = p_user_id;
  insert into public.semen_profiles (user_id, version, source_test_ids, measurements, synthesis, evidence_ids, response_model, embedding_model, prompt_version)
  values (p_user_id, v_version, p_source_test_ids, p_measurements, p_synthesis, p_evidence_ids, p_response_model, p_embedding_model, p_prompt_version)
  returning semen_profiles.id, semen_profiles.created_at into v_id, v_created;
  return query select v_id, v_version, v_created;
end;
$$;
revoke all on function public.create_semen_profile_artifact(uuid, uuid[], jsonb, jsonb, text[], text, text, text) from public, anon;
grant execute on function public.create_semen_profile_artifact(uuid, uuid[], jsonb, jsonb, text[], text, text, text) to authenticated, service_role;
