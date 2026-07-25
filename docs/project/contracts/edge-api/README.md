# Proposed Supabase Edge API contract and on-edit model

- Status: Accepted baseline; first non-ML vertical slice implemented
- Product: PreSeed
- Runtime: Supabase Edge Runtime (Deno-compatible)
- Transport adapter: Hono
- Future compatible transport: Fastify on Node

## Architectural rule

The contract and domain behavior are not owned by Hono or Fastify. Standards-based JSON Schemas plus operation metadata are the executable source. The edge adapter validates Fetch API requests and serializes responses. A future Fastify adapter may register the same schemas and call the same domain services.

```text
Next.js
  → Supabase gateway/JWT
  → api Edge Function
  → Hono transport adapter
  → framework-neutral domain service
  → user-scoped Supabase client
  → Postgres RLS / Storage

shared JSON Schema + operation metadata
  → Hono validation
  → OpenAPI
  → generated frontend types/client
  → optional future Fastify registration
```

## Function and route layout

Use one authenticated function named `api` for the primary product surface. Supabase requires the function-name path prefix; product versioning follows it:

```text
/functions/v1/api/v1/*
```

Representative capabilities:

| Capability | Operations |
| --- | --- |
| Session | `GET /v1/me` |
| Onboarding | `PUT /v1/onboarding` |
| Clinical tests | `POST /v1/clinical-tests`, `GET /v1/clinical-tests/:id` |
| Markers | `PUT /v1/clinical-tests/:id/markers` |
| Assessments | `POST /v1/assessments`, `GET /v1/assessments/latest` for deterministic readiness only |
| Protocols | `POST /v1/protocols`, `GET /v1/protocols/current` |
| Adaptations | Reserved until evidence/coach contracts are implemented |
| Adherence/check-ins | `POST /v1/adherence-events`, `POST /v1/check-ins` |
| Trends | `GET /v1/trends` |
| Coach | Reserved for on-demand Vector RAG after account outputs exist |
| Evidence | `GET /v1/evidence/:id` |
| Uploads | `POST /v1/uploads/intents`, `POST /v1/uploads/:id/confirm` |
| Environment | `POST /v1/environment/snapshots` |

The implemented slice is onboarding → clinical test/markers → deterministic
readiness assessment → protocol → adherence/check-in → retest/trends. No ML
prediction endpoint exists until a model passes its declared promotion gate.

## Contract rules

Each operation declares a stable operation ID, auth requirement, request schemas, all response schemas, error codes, safety classification, idempotency, audit policy, and sensitive-data logging policy.

Unknown fields are rejected for clinical/scoring writes. Measurements carry value, unit, provenance, verification, collection context, and reference-range version. Timestamps are RFC 3339 UTC and identifiers are UUIDs.

The standard success and error envelopes remain transport-independent:

```json
{"data": {}, "meta": {"requestId": "uuid", "contractVersion": "1"}}
```

```json
{"error": {"code": "CLINICAL_TEST_NOT_FOUND", "message": "The clinical test was not found.", "requestId": "uuid", "details": []}}
```

Collections use cursor pagination. Clinical-test, assessment, protocol, adaptation, upload, and webhook writes use idempotency keys. Mutable drafts use optimistic concurrency. Clinical observations, predictions, score snapshots, protocols, adherence, evidence versions, and audits are append-only.

Readiness assessments use rule version `readiness-v0.1.0`. The first assessment is a
baseline. A later assessment returns factor-level point changes only when it has the
same scored input coverage; adding or removing a domain changes confidence and is not
presented as behavioural improvement. Clinical gates are returned separately and
never enter the point calculation.

The application rejects bodies larger than 128 KiB before parsing, accepts only UUID request/resource identifiers, and emits `no-store`, `nosniff`, and `no-referrer` headers. Application-generated responses reflect CORS only for exact origins in `ALLOWED_ORIGINS`. Supabase gateway-generated rejections may carry the gateway's own CORS headers before application code runs; bearer authentication and RLS are the security boundaries, not CORS. Clinical values and reference ranges are non-negative; percentage markers cannot exceed 100.

Clinical-test pagination uses the ordered pair `(collected_at, id)` so equal timestamps cannot skip or duplicate records. Child records use composite foreign keys containing parent ID and user ID, preventing cross-tenant parent/child relationships even if an identifier is disclosed.

## Authentication and database access

The Supabase gateway and edge adapter validate the user session. The request receives a user-scoped Supabase client carrying the caller's authorization token, so Postgres RLS is enforced. Domain services receive an explicit user context, never global mutable auth state.

Secret/service-role access is not the default repository. It is available only through named system operations with explicit audit metadata. Non-owned resources return `404` to avoid leaking existence.

## Clinical output invariants

Assessments keep four outputs separate:

1. measured clinical profile;
2. deterministic modifiable-readiness score;
3. named screening risks with eligibility, uncertainty, model version, and confirmation action;
4. data confidence and missingness.

Serious flags cannot be averaged away. Azoospermia and endocrine outputs are screening risks, not diagnoses. Recommendations contain observation, mechanism, bounded action, allow-listed evidence IDs, studied endpoint, limitations, exclusions, and evidence-backed/general-guidance status.

LLM output must validate against a closed schema. It cannot invent evidence, change scores/gates, recommend hormone treatment, or apply adaptations without confirmation.

## Portable source organization

```text
supabase/functions/api/
  index.ts                 # exports Fetch handler only
  deno.json                # exact pinned edge dependencies
  transport/hono.ts
packages/contracts/
  src/{schemas,operations,errors}/
  generated/{openapi.json,client-types.ts}/
packages/domain/
  src/<capability>/{service,repository-port}.ts
packages/supabase-adapter/
  src/<capability>.repository.ts
apps/api-fastify/          # absent until a Node runtime is justified
```

The precise workspace arrangement is subject to a Deno/npm compatibility spike. Domain packages must use Web/standard APIs and avoid Node-only imports if they execute at the edge.

## On-edit enforcement

For changed schemas, operations, edge routes, or generated clients, the save-time watcher:

1. runs `deno check` for the affected function;
2. checks pinned dependencies and lockfile integrity;
3. builds the Hono application without starting a listener;
4. generates OpenAPI to temporary output;
5. validates schemas and operation-ID uniqueness;
6. compares OpenAPI and client types with committed artifacts;
7. runs affected contract tests using direct Fetch requests;
8. reports dependency/bundle growth.

The watcher reports drift but does not rewrite automatically.

### Impact matrix

| Change | Required impact |
| --- | --- |
| schema/operation/route | OpenAPI/client artifacts or proof unchanged |
| standard error | Error catalogue and contract fixtures |
| auth adapter | JWT, RLS, expired-token and cross-user fixtures |
| migration | Schema snapshot/types and repository integration tests |
| scoring rule | Rule/evidence version and score fixtures |
| model manifest | Model card, metrics, eligibility and prediction fixtures |
| coach policy | Safety, citation and escalation fixtures |
| evidence claim | Source metadata, review status and recommendations |
| separate Edge Function | HTTP/event contract or documented no-impact reason |

## CI gates

- `deno check`, formatting, lint, and locked dependency resolution;
- OpenAPI/client generation yields no diff;
- compatibility comparison against `origin/main` catches breaking changes;
- request/response examples validate;
- direct Fetch tests cover success, validation, auth, ownership, errors, CORS, and idempotency;
- two-user Supabase integration tests prove RLS;
- referenced evidence/model versions exist;
- medical safety fixtures remain rejected;
- bundle size and cold-start spike stay within agreed budgets;
- Node-only imports are rejected from edge-executed domain paths.

## Fastify compatibility test

Contract portability is proven in CI by registering a representative schema and service with a minimal Fastify test adapter and comparing its generated OpenAPI operation with the edge artifact. This is a contract test only; it does not ship Fastify to Supabase.

Only create a deployed Fastify service when a documented requirement cannot safely or economically run in the Edge Runtime—for example long-running Python model inference, durable background processing, or a streaming/runtime feature proven unsuitable at the edge.

## Acceptance decisions

Before implementation, agree on:

- acceptance of ADR 0002;
- Hono and schema/OpenAPI adapter versions;
- monolithic `api` function versus any justified isolated functions;
- schema library and Deno/npm compatibility;
- JWT/RLS test strategy;
- database access through Supabase APIs versus pooled direct Postgres where necessary;
- artifact generation and compatibility tool;
- bundle/cold-start budgets;
- idempotency retention;
- edge/model workload boundary;
- local watcher strictness versus CI enforcement.
