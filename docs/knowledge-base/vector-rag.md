# Vector RAG

PreSeed uses vector retrieval and grounded generation instead of a trained fertility predictor. The decision and safety boundary are canonical in [`../project/adr/0004-vector-rag-over-trained-prediction.md`](../project/adr/0004-vector-rag-over-trained-prediction.md).

## Runtime flow

1. The browser signs the user in with Supabase Auth and sends the bearer token to `POST /functions/v1/api/v1/evidence/answer`.
2. The Edge Function validates the token and origin, then reads only that user's onboarding context and three most recent clinical tests through the user-scoped Supabase client.
3. OpenAI embeds the question plus account context with `text-embedding-3-small` at 1,536 dimensions.
4. PostgreSQL `match_evidence` performs cosine retrieval against reviewed `evidence_chunks`.
5. The Responses API receives only the question, minimum account context, and retrieved evidence. Its output must match a closed JSON Schema.
6. The server rejects any evidence ID outside the retrieved set and resolves citation metadata from Postgres. It stores the structured answer, retrieved IDs, prompt version, model IDs, user ID, and timestamp in `rag_runs` under RLS.
7. The coach UI displays the explanation, source links, limitations, clinical-escalation state, and prototype disclaimer.

Vector RAG does not predict or diagnose azoospermia or endocrine disease. It explains reviewed evidence relevant to entered results. Possible azoospermia, abnormal hormones, severe results, and diagnostic questions route to qualified laboratory or clinical care.

## Evidence ingestion

Migrations seed reviewed text and citation metadata without vectors. Indexing is an explicit privileged operation:

```bash
OPENAI_API_KEY=... \
SUPABASE_URL=... \
SUPABASE_SECRET_KEY=... \
npm run rag:ingest
```

The script selects only rows whose embedding is null, requests 1,536-dimensional embeddings, validates the response count and dimensions, and writes vectors with the configured embedding-model ID. Re-running it is safe and skips already indexed rows.

## Required configuration

- Browser: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Edge Function: `OPENAI_API_KEY`; optional `OPENAI_EMBEDDING_MODEL` and `OPENAI_RAG_MODEL`.
- Ingestion only: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`.

Never expose `SUPABASE_SECRET_KEY` or `OPENAI_API_KEY` to browser code. The runtime Edge Function uses the caller's JWT and RLS; only the ingestion script uses the secret key.
