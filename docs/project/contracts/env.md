# Environment contract

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | yes | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server | yes | RLS-constrained client key |
| `SUPABASE_SECRET_KEY` | server only | no | Explicit administrative RLS bypass |
| `SUPABASE_ACCESS_TOKEN` | CLI / CI | deploy | CLI authentication |
| `SUPABASE_PROJECT_ID` | CLI / CI | deploy | Target project reference |
| `SUPABASE_DB_PASSWORD` | CLI / CI | deploy | Link/push when requested |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | server | no | NEAT collector URL |
| `OTEL_EXPORTER_OTLP_HEADERS` | server | hosted only | Collector authorization |
| `VERCEL_TOKEN` | CI | deploy | Vercel authentication |
| `VERCEL_ORG_ID` | CI | deploy | Vercel team/account |
| `VERCEL_PROJECT_ID` | CI | deploy | Vercel project |
| `ALLOWED_ORIGINS` | Edge API | yes | Comma-separated exact browser origins accepted by CORS |
| `OPENAI_API_KEY` | Edge API + ingestion | RAG | Server-only key for embeddings and grounded Responses calls |
| `OPENAI_EMBEDDING_MODEL` | Edge API + ingestion | no | Embedding model; defaults to `text-embedding-3-small` |
| `OPENAI_RAG_MODEL` | Edge API | no | Grounded response model; defaults to `gpt-5.6-luna` |

Never commit values.
