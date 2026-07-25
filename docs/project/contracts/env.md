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

Never commit values.
