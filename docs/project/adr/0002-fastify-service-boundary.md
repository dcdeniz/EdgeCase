# ADR 0002: Use an edge-native API and preserve Fastify portability

- Status: Accepted
- Date: 2026-07-25

## Context

PreSeed uses Supabase primarily for Auth, Postgres, row-level security, Storage, and globally deployed Edge Functions. It needs a coherent API for clinical data, scoring, protocols, evidence retrieval, AI orchestration, and future model inference.

Supabase Edge Functions execute TypeScript in a Deno-compatible edge runtime. A deployed function exposes a Fetch API handler and runs in short-lived isolates. npm packages and many Node built-ins are supported, but compatibility does not turn the runtime into a persistent Node HTTP server.

Fastify is designed around Node's HTTP server lifecycle, request/response objects, plugins, and a process that normally listens for connections. It has no first-class Supabase Edge Function adapter. A custom bridge could translate each Fetch API `Request` into `fastify.inject()`, but that would initialize or reuse a Node-oriented application inside an isolate, increase bundle and cold-start costs, complicate streaming and observability, and exercise a deployment path neither platform documents as first-class.

Supabase officially documents native routing plus Express, Oak, and Hono for multi-route Edge Functions. Hono exposes a Fetch API handler directly and has a Supabase authentication adapter.

## Decision

Do not run Fastify itself inside Supabase Edge Functions for the initial product.

Implement one edge-native `api` Supabase Function using Hono. Group the PreSeed HTTP surface under the function path, for example:

```text
/functions/v1/api/v1/me
/functions/v1/api/v1/clinical-tests
/functions/v1/api/v1/assessments
/functions/v1/api/v1/protocols
```

Use a portable contracts package containing standards-based JSON Schema, OpenAPI metadata, stable operation IDs, error definitions, examples, and generated TypeScript types. Hono adapters consume those contracts for edge validation and OpenAPI generation. Domain services consume plain typed values and return plain results; they do not depend on Hono, Deno requests, or Supabase gateway objects.

Preserve Fastify portability by keeping contracts and domain services framework-neutral. If PreSeed later needs a long-lived Node service for heavier model inference, background work, streaming, or integrations, Fastify can expose the same operations by registering the same schemas and calling the same services. The OpenAPI compatibility gate prevents the two transports from drifting.

Use separate Supabase Functions only for execution boundaries that differ materially from the main API: unauthenticated provider webhooks, scheduled jobs, or isolated heavy/slow calls. They share contracts or event schemas and must not duplicate domain rules.

Supabase remains responsible for authentication and data services. The edge API uses a user-scoped Supabase client so RLS remains the final authorization boundary. Elevated operations are isolated, named, and audited.

## Consequences

The first product stays inside the chosen Supabase platform and uses its native deployment model, global routing, JWT gateway, local runtime, secrets, and logging. A single API function reduces cold-start fragmentation across CRUD operations.

The team gives up Fastify-specific runtime plugins and injection behavior at the edge. Hono becomes a thin transport adapter, not the domain architecture. Portable JSON Schema/OpenAPI contracts and framework-neutral services retain a credible migration path to Fastify without maintaining two implementations today.

The initial product does not train or host a scikit-learn predictor. Evidence retrieval and grounded explanation run through the edge API using the vector-RAG boundary defined in ADR 0004. A future validated predictive model would require a separate ADR, dataset provenance, calibration, subgroup evaluation, and explicit clinical-safety review.

The initial implementation proves Hono routing, bearer-token validation, user-scoped Supabase access, Fetch-based tests, and pinned edge dependencies. Bundle, hosted RLS, cold-start, and OpenTelemetry checks remain release gates.
