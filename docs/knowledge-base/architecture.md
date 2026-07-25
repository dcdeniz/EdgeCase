# Architecture

Browser → Vercel CDN / Next.js App Router → Hono-based Supabase `api` Edge Function → Supabase Postgres/pgvector → OpenAI embeddings and Responses APIs when evidence explanation is requested.

Next.js owns web rendering; the `api` Edge Function owns CRUD plus account-scoped evidence orchestration; migrations own schema and reviewed evidence; RLS protects user data; NEAT supplies OpenTelemetry. PreSeed does not train a hackathon predictor. Vector retrieval finds approved evidence and a schema-constrained response layer explains it with server-validated citations. See [ADR 0001](../project/adr/0001-platform-baseline.md), [ADR 0002](../project/adr/0002-fastify-service-boundary.md), and [ADR 0004](../project/adr/0004-vector-rag-over-trained-prediction.md).
