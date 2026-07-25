# Architecture

Browser → Vercel CDN / Next.js App Router → Hono-based Supabase `api` Edge Function → Supabase Postgres.

Next.js owns web rendering; the `api` Edge Function owns the non-ML product contract; migrations own schema; RLS protects user data; NEAT supplies OpenTelemetry. ML remains an abstract laptop-run boundary until the cofounder model PRs land. See [ADR 0001](../project/adr/0001-platform-baseline.md) and [ADR 0002](../project/adr/0002-fastify-service-boundary.md).
