create table public.score_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  previous_snapshot_id uuid,
  observed_at timestamptz not null,
  readiness_score smallint not null check (readiness_score between 0 and 100),
  confidence_score smallint not null check (confidence_score between 0 and 100),
  rule_version text not null check (char_length(rule_version) between 1 and 100),
  input_snapshot jsonb not null check (jsonb_typeof(input_snapshot) = 'object'),
  domain_scores jsonb not null check (jsonb_typeof(domain_scores) = 'array'),
  factor_scores jsonb not null check (jsonb_typeof(factor_scores) = 'array'),
  clinical_gates jsonb not null check (jsonb_typeof(clinical_gates) = 'array'),
  change_explanation jsonb,
  interpretation text not null check (char_length(interpretation) between 1 and 2000),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, idempotency_key),
  foreign key (previous_snapshot_id, user_id)
    references public.score_snapshots(id, user_id)
    on delete set null (previous_snapshot_id)
);

create index score_snapshots_user_observed_idx
  on public.score_snapshots (user_id, observed_at desc, id desc);

create trigger score_snapshots_user_guard
before insert or update on public.score_snapshots
for each row execute function public.enforce_current_user_id();

alter table public.score_snapshots enable row level security;

create policy score_snapshots_select_own
  on public.score_snapshots for select to authenticated
  using ((select auth.uid()) = user_id);

create policy score_snapshots_insert_own
  on public.score_snapshots for insert to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on public.score_snapshots to authenticated;
