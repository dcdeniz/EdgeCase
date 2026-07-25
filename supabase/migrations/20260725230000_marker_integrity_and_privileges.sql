create function public.enforce_clinical_marker_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_test_type text;
  v_expected_test_type text;
  v_expected_unit text;
begin
  select test_type
    into v_test_type
    from public.clinical_tests
   where id = new.test_id and user_id = new.user_id;

  select expected_test_type, expected_unit
    into v_expected_test_type, v_expected_unit
    from (values
      ('volume_ml', 'semen_analysis', 'mL'),
      ('concentration_million_ml', 'semen_analysis', 'million/mL'),
      ('total_count_million', 'semen_analysis', 'million'),
      ('progressive_motility_pct', 'semen_analysis', '%'),
      ('total_motility_pct', 'semen_analysis', '%'),
      ('normal_morphology_pct', 'semen_analysis', '%'),
      ('dna_fragmentation_pct', 'semen_analysis', '%'),
      ('fsh_iu_l', 'hormone_panel', 'IU/L'),
      ('lh_iu_l', 'hormone_panel', 'IU/L'),
      ('total_testosterone_nmol_l', 'hormone_panel', 'nmol/L'),
      ('free_testosterone_nmol_l', 'hormone_panel', 'nmol/L'),
      ('estradiol_pmol_l', 'hormone_panel', 'pmol/L'),
      ('prolactin_miu_l', 'hormone_panel', 'mIU/L'),
      ('shbg_nmol_l', 'hormone_panel', 'nmol/L'),
      ('tsh_miu_l', 'hormone_panel', 'mIU/L')
    ) as marker_metadata(code, expected_test_type, expected_unit)
   where code = new.code;

  if v_test_type is null
     or v_test_type is distinct from v_expected_test_type
     or new.unit is distinct from v_expected_unit then
    raise exception using
      errcode = '23514',
      message = 'clinical marker does not match its test type and canonical unit';
  end if;

  return new;
end;
$$;

create trigger clinical_markers_metadata_guard
before insert or update on public.clinical_markers
for each row execute function public.enforce_clinical_marker_metadata();

revoke all on public.clinical_tests, public.clinical_markers,
  public.protocols, public.protocol_items, public.adherence_events,
  public.check_ins from anon;

revoke update, delete on public.protocols, public.protocol_items
  from authenticated;

revoke all on function public.enforce_current_user_id() from public, anon, authenticated;
revoke all on function public.enforce_clinical_marker_metadata() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
