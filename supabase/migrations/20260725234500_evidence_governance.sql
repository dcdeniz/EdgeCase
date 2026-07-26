alter table public.evidence_chunks
  add column review_status text not null default 'approved'
    check (review_status in ('candidate', 'approved', 'rejected', 'withdrawn')),
  add column reviewed_by text,
  add column source_locator text,
  add column source_license text,
  add column source_pmcid text check (source_pmcid is null or source_pmcid ~ '^PMC[0-9]+$'),
  add column source_doi text,
  add column reuse_basis text not null default 'curated_summary'
    check (reuse_basis in ('curated_summary', 'open_license', 'permission', 'public_domain')),
  add column content_version integer not null default 1 check (content_version > 0),
  add column is_retracted boolean not null default false,
  add constraint evidence_approved_review_check check (
    review_status <> 'approved' or (
      reviewed_at is not null and
      reviewed_by is not null and char_length(reviewed_by) between 1 and 200 and
      source_locator is not null and char_length(source_locator) between 1 and 500 and
      is_retracted = false
    )
  ) not valid,
  add constraint evidence_embedding_review_check check (
    embedding is null or (review_status = 'approved' and is_retracted = false)
  ) not valid;

update public.evidence_chunks
set
  reviewed_by = 'PreSeed initial evidence review',
  source_locator = 'Curated claim summary; verify against the linked source before publication',
  reuse_basis = 'curated_summary'
where reviewed_by is null;

alter table public.evidence_chunks validate constraint evidence_approved_review_check;
alter table public.evidence_chunks validate constraint evidence_embedding_review_check;

drop policy evidence_chunks_authenticated_read on public.evidence_chunks;
create policy evidence_chunks_authenticated_read
  on public.evidence_chunks for select to authenticated
  using (review_status = 'approved' and is_retracted = false);

drop index public.evidence_chunks_embedding_hnsw;
create index evidence_chunks_embedding_hnsw
  on public.evidence_chunks using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null and review_status = 'approved' and is_retracted = false;

create or replace function public.match_evidence(
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
  where
    chunk.embedding is not null and
    chunk.review_status = 'approved' and
    chunk.is_retracted = false
  order by chunk.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 8);
$$;

revoke all on function public.match_evidence(extensions.vector, integer) from public, anon;
grant execute on function public.match_evidence(extensions.vector, integer) to authenticated;

grant select, insert, update on public.evidence_chunks to service_role;
