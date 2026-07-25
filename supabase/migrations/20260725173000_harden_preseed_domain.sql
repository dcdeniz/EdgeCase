alter table public.profiles
  add constraint profiles_completed_requires_consent
  check (onboarding_completed_at is null or health_data_consented_at is not null);

alter table public.clinical_markers
  add constraint clinical_markers_nonnegative
    check (numeric_value >= 0 and (reference_low is null or reference_low >= 0) and (reference_high is null or reference_high >= 0)),
  add constraint clinical_markers_reference_order
    check (reference_low is null or reference_high is null or reference_low <= reference_high),
  add constraint clinical_markers_percent_range
    check (code not in ('progressive_motility_pct', 'total_motility_pct', 'normal_morphology_pct', 'dna_fragmentation_pct') or numeric_value <= 100);

alter table public.protocols
  add constraint protocols_maximum_duration
  check (ends_on <= starts_on + 730);
