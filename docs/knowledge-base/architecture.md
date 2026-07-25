# Architecture

Browser → Vercel CDN / Next.js App Router → Supabase Edge Functions → Supabase Postgres.

Next.js owns web rendering; Edge Functions own backend HTTP contracts; migrations own schema; RLS protects user data; NEAT supplies OpenTelemetry. See [ADR 0001](../project/adr/0001-platform-baseline.md).
