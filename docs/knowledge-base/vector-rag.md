# Vector RAG

PreSeed uses vector retrieval and grounded generation instead of a trained fertility predictor. It is a structured data engine, not a chatbot. The decision and safety boundary are canonical in [`../project/adr/0004-vector-rag-over-trained-prediction.md`](../project/adr/0004-vector-rag-over-trained-prediction.md) and [`../project/adr/0007-structured-rag-data-engine.md`](../project/adr/0007-structured-rag-data-engine.md).

## Runtime flow

1. Clinical reports and onboarding context are persisted before compilation.
2. `POST /functions/v1/api/v1/data-engine/semen-profile/compile` reads the account's latest semen analysis and latest hormone panel and normalizes their values. It may derive arithmetic totals from measured operands, always marked `derived`.
3. OpenAI embeds a global context query plus one query per available parameter with `text-embedding-3-small` at 1,536 dimensions.
4. PostgreSQL `match_evidence` retrieves only reviewed, approved, non-retracted `evidence_chunks`; the Edge Function fuses and deduplicates the result sets.
5. The Responses API receives normalized inputs, minimum account context, and retrieved evidence. Its output must match the closed semen-profile JSON Schema.
6. The server rejects marker codes and evidence IDs outside the supplied allowlists. Evidence-backed suggestions require at least one retrieved evidence ID.
7. Postgres transactionally stores the immutable artifact in `semen_profiles`, with its source test IDs, measurements, synthesis, evidence IDs, prompt version, model IDs, account ID, and monotonically increasing version.
8. Results, protocol, progress, comparison, and adaptation features read this artifact. They do not use chat history.

Vector RAG does not predict or diagnose azoospermia or endocrine disease. It compiles reviewed evidence relevant to entered results into feature data. Possible azoospermia, abnormal hormones, severe results, and diagnostic questions route to qualified laboratory or clinical care.

## Evidence ingestion

Corpus discovery and publication are separate trust boundaries:

1. `npm run corpus:discover` records open-full-text candidates and article-level reuse licences.
2. `npm run corpus:fetch` downloads licensed BioC working copies into a gitignored directory.
3. `npm run corpus:prepare` creates an unapproved passage review queue.
4. A named human reviewer converts supported atomic claims into `data/corpus/approved-claims.json`, including an exact locator, evidence level, reuse basis, limitations, and `humanReviewConfirmed: true`.
5. `npm run corpus:publish` validates this file in dry-run mode. `CORPUS_PUBLISH_APPLY=true` performs the privileged database upsert and clears stale embeddings when reviewed content changes.
6. `npm run rag:ingest` embeds only approved, non-retracted evidence.

Candidates and downloaded articles are never directly searchable. PostgreSQL enforces review state, reviewer provenance, source locator, content version, and retraction state; `match_evidence` filters to approved, non-retracted rows even if a privileged client writes an invalidly indexed candidate.

Indexing remains an explicit privileged operation:

```bash
OPENAI_API_KEY=... \
SUPABASE_URL=... \
SUPABASE_SECRET_KEY=... \
npm run rag:ingest
```

The script selects only approved, non-retracted rows whose embedding is null, requests 1,536-dimensional embeddings, validates the response count and dimensions, and writes vectors with the configured embedding-model ID. Re-running it is safe and skips already indexed rows.

## Required configuration

- Browser: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Edge Function: `OPENAI_API_KEY`; optional `OPENAI_EMBEDDING_MODEL` and `OPENAI_RAG_MODEL`.
- Ingestion only: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`.

Never expose `SUPABASE_SECRET_KEY` or `OPENAI_API_KEY` to browser code. The runtime Edge Function uses the caller's JWT and RLS; only the ingestion script uses the secret key.
