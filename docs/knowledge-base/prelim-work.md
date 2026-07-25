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
- Added a Python 3.12 `uv` research workspace for a leakage-controlled VISEM
  progressive-motility baseline. It range-fetches only three pinned CSV members,
  performs deterministic repeated nested cross-validation, records promotion gates,
  and exports a non-commercial research artifact and model card.
- The first real VISEM evaluation did not meet the predeclared runtime gate: core
  improved MAE by 1.34% over mean with median held-out R² -0.027, and core plus
  hormones improved MAE by 2.80% with median R² -0.036. No ML runtime preview was
  added.
- Added the next-stage prospective research contract: repeated semen tests, strictly
  pre-target 30/60/90-day features, previous-result baseline, incremental feature
  blocks, and participant/time/site isolation. Its committed four-person fixture is
  explicitly synthetic and cannot train or promote a runtime model.
- Added deterministic readiness rule version `readiness-v0.1.0`, an allow-listed
  evidence registry, append-only score snapshots, and authenticated assessment
  operations. The first assessment is a baseline; comparable later inputs produce a
  separate factor-level point ledger. Clinical gates remain outside the score.
- Added a pinned UCI Fertility screening experiment with repeated nested stratified
  validation, fold-local imbalance handling, nested calibration and threshold
  selection, six model families, two operating-threshold rules, and an explicit
  all-normal baseline. An exploratory prevalence-threshold forest reached 0.665
  balanced accuracy, 0.750 sensitivity, and 0.580 specificity. The result varied
  materially across seeds and the 0.90 target failed, so no runtime model was exported.

## Important choices

The baseline favors one deployable web app, one Edge Function, and one placeholder user-owned table. This minimizes ceremony while proving each part of the chosen stack. `notes` is intentionally disposable once the hackathon domain is defined. Supabase migrations and OpenAPI are canonical; prose summarizes them. Accepted ADRs are append-only.

NEAT's full `npx neat.is` command starts its daemon and dashboard. Repository scripts instead separate the reviewable `neat init .` preview from `neat init . --apply`; production telemetry requires a reachable collector endpoint and authorization header.

## Verification and limitations

- Dependency installation and NEAT generation completed successfully.
- `npm run check` passed (documentation validation, ESLint with two non-blocking warnings in NEAT-generated code, and strict TypeScript). `npm run build` passed and produced static `/` plus dynamic `/api/health` routes.
- A complete local Supabase database reset requires the Docker-based local stack and was not completed. No existing Supabase or Vercel provider account was linked, queried, or changed.
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

## Deployment sequence

1. Create a Supabase project, authenticate/link the CLI, dry-run and push the migration, then deploy `health`.
2. Create/link a Vercel project, add the browser-safe Supabase variables and optional NEAT collector variables, and deploy.
3. Point `OTEL_EXPORTER_OTLP_ENDPOINT` at an accessible NEAT collector for hosted traces; local NEAT defaults to its local OTLP listener.
