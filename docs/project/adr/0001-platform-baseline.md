# ADR 0001: Platform baseline

- Status: Accepted
- Date: 2026-07-25

## Context

The hackathon needs rapid global hosting, authenticated data, backend logic, observability, and shared agent context.

## Decision

Use Next.js App Router on Vercel; Supabase Edge Functions and Postgres; migrations plus RLS; NEAT observability; and versioned contracts plus ADRs.

## Consequences

The team gets managed services and a TypeScript-centric repo, while accepting provider coupling and a requirement to keep contracts synchronized.
