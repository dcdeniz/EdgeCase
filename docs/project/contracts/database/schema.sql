-- Review snapshot; executable source is supabase/migrations/20260725000000_initial_schema.sql.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 100),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200), body text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.notes enable row level security;

-- Product-domain snapshot; detailed constraints, indexes, functions, and policies
-- are canonical in the ordered files under supabase/migrations/.
create table public.clinical_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_type text not null, source text not null, collected_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table public.clinical_markers (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.clinical_tests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null, numeric_value numeric not null, unit text not null,
  unique (test_id, code)
);
create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null, status text not null, starts_on date not null,
  ends_on date not null, title text not null, created_at timestamptz not null default now(),
  unique (user_id, version)
);
create table public.protocol_items (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_number integer not null, category text not null, title text not null,
  description text not null, evidence_status text not null, evidence_ids text[] not null default '{}'
);
create table public.adherence_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_item_id uuid not null references public.protocol_items(id) on delete cascade,
  occurred_on date not null, status text not null,
  unique (user_id, protocol_item_id, occurred_on)
);
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_id uuid references public.protocols(id) on delete set null,
  adherence_rating integer, wellbeing_rating integer, created_at timestamptz not null default now()
);
create table public.score_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  previous_snapshot_id uuid,
  observed_at timestamptz not null,
  readiness_score smallint not null,
  confidence_score smallint not null,
  rule_version text not null,
  input_snapshot jsonb not null,
  domain_scores jsonb not null,
  factor_scores jsonb not null,
  clinical_gates jsonb not null,
  change_explanation jsonb,
  interpretation text not null,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

alter table public.clinical_tests enable row level security;
alter table public.clinical_markers enable row level security;
alter table public.protocols enable row level security;
alter table public.protocol_items enable row level security;
alter table public.adherence_events enable row level security;
alter table public.check_ins enable row level security;
alter table public.score_snapshots enable row level security;

-- Vector-RAG snapshot; executable source, grants, retrieval function, seed
-- evidence, and constraints are canonical in
-- supabase/migrations/20260725233000_vector_rag.sql.
create table public.evidence_chunks (
  id text primary key,
  title text not null,
  source_url text not null,
  citation text not null,
  content text not null,
  evidence_level text not null,
  tags text[] not null default '{}',
  embedding extensions.vector(1536),
  embedding_model text,
  review_status text not null,
  reviewed_at date not null,
  reviewed_by text,
  source_locator text,
  source_license text,
  source_pmcid text,
  source_doi text,
  reuse_basis text not null,
  content_version integer not null,
  is_retracted boolean not null,
  created_at timestamptz not null default now()
);
create table public.rag_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer jsonb not null,
  retrieved_evidence_ids text[] not null,
  response_model text not null,
  embedding_model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now()
);
alter table public.evidence_chunks enable row level security;
alter table public.rag_runs enable row level security;

-- Structured data-engine snapshot; executable source, transactional versioning,
-- grants, and policies are canonical in
-- supabase/migrations/20260725235000_semen_profile_engine.sql.
create table public.semen_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null,
  source_test_ids uuid[] not null,
  measurements jsonb not null,
  synthesis jsonb not null,
  evidence_ids text[] not null,
  response_model text not null,
  embedding_model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  unique (user_id, version)
);
alter table public.semen_profiles enable row level security;
