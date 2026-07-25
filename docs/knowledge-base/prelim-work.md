# Preliminary work report

Date: 2026-07-25

## Delivered

- Initialized the existing Git workspace as an npm-based Next.js 16 App Router project with TypeScript, Tailwind CSS, ESLint, a starter landing page, and `/api/health` route for Vercel.
- Installed `@supabase/supabase-js`, `@supabase/ssr`, and the project-local Supabase CLI. Generated `supabase/config.toml`, a public `health` Edge Function, and an initial `notes` Postgres migration with timestamps, ownership index, update trigger, RLS, and per-user CRUD policies.
- Installed `neat.is` 0.6.x. Ran its discovery preview and then `neat init . --apply`; NEAT generated the supported Next.js Node and Edge OpenTelemetry hooks and added its required OpenTelemetry dependencies.
- Created the shared `docs/knowledge-base/` tree, ordered by `manifest.json`, plus a root `AGENTS.md` contract so developers and agents load the same context.
- Created canonical `docs/project/` contracts for HTTP, database, and environment boundaries, plus an ADR template and accepted platform-baseline ADR.
- Added a fast documentation validator, on-edit watcher, checked-in pre-commit hook, and GitHub Actions workflow. The validator checks knowledge-manifest completeness, ADR structure/status, relative links, and basic OpenAPI structure.
- Added committed environment templates and kept all real `.env` files ignored.
- Assigned EdgeCase the 553xx Supabase local port range so its stack can run alongside the existing Newdryve stack.
- Linked the repository to the hosted EdgeCase Supabase project and added an app-owned `profiles` table plus authenticated notes CRUD Edge Function. Profile creation participates in the same PostgreSQL transaction as Auth signup; foreign keys, checks, triggers, indexes, grants, and RLS enforce integrity and ownership.

## Important choices

The baseline favors one deployable web app, one Edge Function, and one placeholder user-owned table. This minimizes ceremony while proving each part of the chosen stack. `notes` is intentionally disposable once the hackathon domain is defined. Supabase migrations and OpenAPI are canonical; prose summarizes them. Accepted ADRs are append-only.

NEAT's full `npx neat.is` command starts its daemon and dashboard. Repository scripts instead separate the reviewable `neat init .` preview from `neat init . --apply`; production telemetry requires a reachable collector endpoint and authorization header.

## Verification and limitations

- Dependency installation and NEAT generation completed successfully.
- `npm run check` passed (documentation validation, ESLint with two non-blocking warnings in NEAT-generated code, and strict TypeScript). `npm run build` passed and produced static `/` plus dynamic `/api/health` routes.
- The Docker-based local Supabase stack is running. All migrations were applied non-destructively with `supabase migration up --local`, and `supabase db lint --local --level warning` reports no schema errors.
- npm reported transitive dependency vulnerabilities after adding the young NEAT toolchain. Do not run a breaking `npm audit fix --force` during the hackathon without reviewing the dependency changes.

## Hosted Supabase status

- Linked project: `EdgeCase` (`gxwahadomgbgpavihvsp`, `eu-west-1`).
- Applied migration `20260725000000` and verified local/remote migration history matches.
- Deployed `health` and JWT-protected `notes` Edge Functions.
- Verified hosted `health` returns a successful JSON response and unauthenticated `notes` requests are rejected with HTTP 401.
- No seed users or notes were created. Authenticated CRUD should be exercised by the frontend once its product sign-in flow is chosen.

## PreSeed Edge API

- Added and deployed a pinned Hono/Deno `api` Edge Function with standard envelopes, request IDs, CORS, token validation, and user-scoped Supabase access.
- Added onboarding, clinical-test/marker, protocol, adherence, check-in, and trend operations. ML/assessment endpoints are intentionally absent pending the cofounder model PRs.
- Applied the product-domain migration with RLS, composite ownership constraints, append-oriented records, validation, indexes, and transactional protocol replacement; verified local and hosted migration histories match.
- Added Fetch-level contract tests and wired Deno checks/tests into `npm run check` and the on-edit watcher.
- Verified the hosted API gateway rejects unauthenticated account access with HTTP 401. No user or simulated clinical data was created during deployment verification.
- Refreshed and queried the NEAT graph for dependencies, policies, and divergence. Hardened request-size, CORS, identifier, pagination, numerical-range, consent, duration, and composite tenant-integrity boundaries under the ACID/data-flow/cybersecurity audit.
- Applied and deployed the hardening migration/API revision. Hosted verification found Supabase gateway-generated 401 responses use gateway CORS headers before application middleware; this is documented and no protected payload is returned.

## ACID, data-flow, and cybersecurity continuation

- NEAT initially reported no incidents or policy violations and one high-confidence divergence: the Edge Function's declared Supabase dependency had no observed runtime traffic. Runtime verification showed that the local function was not being served; after starting it, `/functions/v1/api/health` returned 200 and the protected `/functions/v1/api/v1/me` path returned 401 without a bearer token.
- Fixed a domain-integrity hole that allowed semen and hormone markers to be attached to the wrong clinical-test type and allowed arbitrary units. The Edge Function now validates a closed marker-to-test-type-to-unit mapping, and a PostgreSQL trigger enforces the same invariant for direct Data API clients and concurrent writes.
- Tightened least privilege by explicitly revoking domain-table access from `anon`, revoking protocol mutation privileges not required by the immutable protocol flow, and revoking direct execution of trigger-only helper functions.
- Runtime gateway testing found local Supabase/Kong adds `Access-Control-Allow-Origin: *`, so omission of an application CORS header was not an effective enforcement boundary. Protected routes now actively return 403 for browser origins outside `ALLOWED_ORIGINS`; native and server clients without an `Origin` header remain supported.
- Corrected the Supabase CLI configuration section from unsupported `[local_smtp]` to `[inbucket]`, restoring local status, migration, and lint commands.
- Updated NEAT from 0.4.6 to 0.6.2 to resolve snapshot-schema incompatibility. The refreshed graph contains the current source snapshot; it still reports the Supabase dependency as missing-observed because Deno Edge Function traffic is not currently exported into NEAT's Node OpenTelemetry collector.
- Verification after these changes: eight Edge Function tests pass, documentation contracts pass, strict TypeScript passes, PostgreSQL lint reports no errors, and the complete `npm run check` passes with only two pre-existing warnings in NEAT-generated instrumentation.
- Pushed migration `20260725230000` and deployed the revised `api` function to the linked EdgeCase project. Hosted gateway JWT verification remains enabled as defense in depth, so unauthenticated requests are rejected by Supabase before application middleware; use the separate public `health` function for availability checks.

## Deployment sequence

1. Create a Supabase project, authenticate/link the CLI, dry-run and push the migration, then deploy `health`.
2. Create/link a Vercel project, add the browser-safe Supabase variables and optional NEAT collector variables, and deploy.
3. Point `OTEL_EXPORTER_OTLP_ENDPOINT` at an accessible NEAT collector for hosted traces; local NEAT defaults to its local OTLP listener.
