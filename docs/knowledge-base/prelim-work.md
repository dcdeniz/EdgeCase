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

## Important choices

The baseline favors one deployable web app, one Edge Function, and one placeholder user-owned table. This minimizes ceremony while proving each part of the chosen stack. `notes` is intentionally disposable once the hackathon domain is defined. Supabase migrations and OpenAPI are canonical; prose summarizes them. Accepted ADRs are append-only.

NEAT's full `npx neat.is` command starts its daemon and dashboard. Repository scripts instead separate the reviewable `neat init .` preview from `neat init . --apply`; production telemetry requires a reachable collector endpoint and authorization header.

## Verification and limitations

- Dependency installation and NEAT generation completed successfully.
- `npm run check` passed (documentation validation, ESLint with two non-blocking warnings in NEAT-generated code, and strict TypeScript). `npm run build` passed and produced static `/` plus dynamic `/api/health` routes.
- A complete local Supabase database reset requires the Docker-based local stack and was not completed. No existing Supabase or Vercel provider account was linked, queried, or changed.
- npm reported transitive dependency vulnerabilities after adding the young NEAT toolchain. Do not run a breaking `npm audit fix --force` during the hackathon without reviewing the dependency changes.

## Deployment sequence

1. Create a Supabase project, authenticate/link the CLI, dry-run and push the migration, then deploy `health`.
2. Create/link a Vercel project, add the browser-safe Supabase variables and optional NEAT collector variables, and deploy.
3. Point `OTEL_EXPORTER_OTLP_ENDPOINT` at an accessible NEAT collector for hosted traces; local NEAT defaults to its local OTLP listener.
