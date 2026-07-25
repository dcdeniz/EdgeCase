create extension if not exists vector with schema extensions;

create table public.evidence_chunks (
  id text primary key check (id ~ '^ev_[a-z0-9_]+$'),
  title text not null check (char_length(title) between 1 and 240),
  source_url text not null check (source_url ~ '^https://'),
  citation text not null check (char_length(citation) between 1 and 500),
  content text not null check (char_length(content) between 40 and 5000),
  evidence_level text not null check (evidence_level in ('systematic_review', 'randomized_trial', 'observational', 'mechanistic', 'clinical_guidance')),
  tags text[] not null default '{}',
  embedding extensions.vector(1536),
  embedding_model text,
  reviewed_at date not null,
  created_at timestamptz not null default now(),
  check ((embedding is null) = (embedding_model is null))
);

create index evidence_chunks_embedding_hnsw
  on public.evidence_chunks using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null;

create table public.rag_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 800),
  answer jsonb not null check (jsonb_typeof(answer) = 'object'),
  retrieved_evidence_ids text[] not null check (cardinality(retrieved_evidence_ids) between 1 and 8),
  response_model text not null,
  embedding_model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now()
);
create index rag_runs_user_created_idx on public.rag_runs (user_id, created_at desc);

create trigger rag_runs_user_guard
before insert or update on public.rag_runs
for each row execute function public.enforce_current_user_id();

alter table public.evidence_chunks enable row level security;
alter table public.rag_runs enable row level security;

create policy evidence_chunks_authenticated_read
  on public.evidence_chunks for select to authenticated using (true);
create policy rag_runs_own_select
  on public.rag_runs for select to authenticated using ((select auth.uid()) = user_id);
create policy rag_runs_own_insert
  on public.rag_runs for insert to authenticated with check ((select auth.uid()) = user_id);

revoke all on public.evidence_chunks, public.rag_runs from anon;
grant select on public.evidence_chunks to authenticated;
grant select, insert on public.rag_runs to authenticated;

create function public.match_evidence(
  query_embedding extensions.vector(1536),
  match_count integer default 6
)
returns table (
  id text,
  title text,
  source_url text,
  citation text,
  content text,
  evidence_level text,
  tags text[],
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    chunk.id,
    chunk.title,
    chunk.source_url,
    chunk.citation,
    chunk.content,
    chunk.evidence_level,
    chunk.tags,
    1 - (chunk.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.evidence_chunks as chunk
  where chunk.embedding is not null
  order by chunk.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 8);
$$;

revoke all on function public.match_evidence(extensions.vector, integer) from public, anon;
grant execute on function public.match_evidence(extensions.vector, integer) to authenticated;

insert into public.evidence_chunks
  (id, title, source_url, citation, content, evidence_level, tags, reviewed_at)
values
  (
    'ev_antioxidant_nma_2022',
    'Antioxidants and male infertility network meta-analysis',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC8898892/',
    'Network meta-analysis; 23 randomized trials; 1,917 participants (2022).',
    'In men treated for infertility, omega-3 ranked first for sperm concentration, while L-carnitine ranked highly for motility and morphology. These estimates apply to studied infertility populations, not every man. The analysis did not establish a guaranteed pregnancy benefit, so the evidence supports parameter-focused guidance only.',
    'systematic_review',
    array['concentration', 'motility', 'morphology', 'supplements', 'omega_3', 'carnitine'],
    '2026-07-25'
  ),
  (
    'ev_smoking_meta_2016',
    'Smoking and semen quality meta-analysis',
    'https://pubmed.ncbi.nlm.nih.gov/27113031/',
    'Systematic review and meta-analysis of 5,865 participants (2016).',
    'Cigarette smoking was associated with lower sperm count, motility, and morphology, with larger effects among moderate and heavy smokers. This is association-level population evidence and should support smoking-cessation guidance without promising a specific individual improvement or conception outcome.',
    'systematic_review',
    array['smoking', 'concentration', 'motility', 'morphology', 'oxidative_stress'],
    '2026-07-25'
  ),
  (
    'ev_weight_loss_rct_2022',
    'Weight loss and semen quality randomized trial',
    'https://doi.org/10.1093/humrep/deac096',
    'Andersen et al., Human Reproduction 2022; randomized obesity cohort.',
    'An eight-week low-calorie intervention in men with obesity improved sperm concentration and count. Benefits at one year were associated with maintaining weight loss. The result supports gradual, sustained weight-management guidance for people to whom it applies; it does not justify rapid weight loss or a guaranteed fertility outcome.',
    'randomized_trial',
    array['weight', 'bmi', 'concentration', 'count', 'metabolic_health'],
    '2026-07-25'
  ),
  (
    'ev_air_pollution_meta_2023',
    'Ambient air pollution and semen quality meta-analysis',
    'https://pubmed.ncbi.nlm.nih.gov/36731563/',
    'Environmental Science & Technology systematic review and meta-analysis (2023).',
    'Higher particulate air-pollution exposure was associated with lower sperm density, total count, progressive motility, and total motility. The likely pathway includes oxidative stress. Exposure-reduction advice must be framed as lowering a modifiable risk; HEPA filtration reduces particulate exposure, but no trial has shown that a HEPA purifier directly improves semen outcomes.',
    'systematic_review',
    array['air_pollution', 'pm2_5', 'motility', 'count', 'oxidative_stress', 'exposure'],
    '2026-07-25'
  ),
  (
    'ev_sleep_testosterone_2011',
    'Sleep restriction and testosterone',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC4445839/',
    'Leproult and Van Cauter, JAMA 2011; small controlled study.',
    'One week of restricted sleep reduced daytime testosterone in a small study of healthy young men. The study measured testosterone, not sperm outcomes. It supports sleep as context for the hormonal environment but cannot be used to predict an endocrine disorder or a change in sperm count.',
    'randomized_trial',
    array['sleep', 'testosterone', 'hormones', 'endocrine'],
    '2026-07-25'
  ),
  (
    'ev_azoospermia_who_2021',
    'WHO semen examination requirements',
    'https://www.who.int/publications/i/item/9789240030787',
    'WHO laboratory manual for examination and processing of human semen, sixth edition.',
    'Azoospermia is a laboratory finding that requires examination of a centrifuged semen-sample sediment. A phone, questionnaire, home optical workflow, or retrieval system cannot confirm zero sperm. PreSeed may explain risk context and trends from entered laboratory results, but must route suspected azoospermia to a qualified laboratory and clinician.',
    'clinical_guidance',
    array['azoospermia', 'laboratory', 'semen_analysis', 'clinical_escalation'],
    '2026-07-25'
  );
