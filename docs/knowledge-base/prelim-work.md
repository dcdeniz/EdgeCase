# Preliminary work report

Date: 2026-07-25

## Delivered

- Accepted the copy-ready ElevenLabs `PreSeed Daily Check-in` system/dispatch prompt as a canonical contract. It constrains the voice agent to brief structured capture, confirmation, medical escalation, and exactly one `record_daily_checkin` tool call. The richer dispatch operation is explicitly pending and must not be confused with the existing narrow `/v1/check-ins` endpoint.

- Added a reviewable public hackathon demo mode. When `PUBLIC_DEMO_MODE=true`, the API accepts requests without bearer authentication and uses the service role for one dedicated synthetic `PUBLIC_DEMO_USER_ID`; the login screen is removed and the UI clearly warns that all visitors share mutable demo data. PostgreSQL RLS remains defined for future authenticated use, while this mode intentionally bypasses it at the API boundary. Never configure it with a real user's ID or real health information.

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

## Vector-RAG implementation

- Added a licence-aware corpus pipeline using Europe PMC discovery and PMC BioC full text, with gitignored source working copies, an explicit human-review queue, a closed approved-claims contract, dry-run publication, embedding invalidation on content changes, and database-enforced approved/non-retracted retrieval. Evidence text is escaped before prompt assembly so source documents cannot break the evidence-block boundary.

- Replaced the planned hackathon scikit-learn predictor with the vector-RAG architecture in ADR 0004. The product now produces evidence-grounded explanation, not a diagnostic probability or disease prediction.
- Added real browser Supabase sign-up/sign-in and connected the coach screen to an authenticated account-scoped Edge API route.
- Added pgvector-backed `evidence_chunks`, cosine retrieval through `match_evidence`, per-user `rag_runs` audit records, RLS, least-privilege grants, an HNSW index, and six reviewed evidence seeds spanning supplements, smoking, weight, pollution, sleep/testosterone, and azoospermia laboratory requirements.
- Added `scripts/rag-ingest.mjs`. It embeds only unindexed reviewed evidence with `text-embedding-3-small`, validates 1,536 dimensions, and writes vectors using the server-only Supabase secret key.
- Added the grounded Responses API path. It builds retrieval context from the authenticated user's track, onboarding data, and three most recent clinical tests; sends only retrieved evidence to synthesis; requires a closed JSON shape; rejects invented evidence IDs; resolves source metadata server-side; hashes the provider safety identifier; and persists the auditable result before returning it.
- Added a live coach question form with loading/error states, citations, limitations, clinician-escalation status, and the research-prototype disclaimer. Prepared fixture answers remain for offline demos.
- Added RAG unit tests covering citation allow-list enforcement, Responses payload extraction, and privacy-preserving safety identifiers. Eleven Edge Function tests, strict TypeScript, documentation checks, PostgreSQL lint, and the production Next.js build pass.
- Applied migrations `20260725233000` and `20260725233500` locally and to hosted EdgeCase, then deployed the revised `api` function with gateway JWT verification retained.
- Live provider completion is deliberately not claimed: `OPENAI_API_KEY` is not present in the local environment, and the six seeded hosted/local evidence rows still require `npm run rag:ingest`. The authenticated local endpoint was exercised and correctly returned `503 RAG_NOT_CONFIGURED` rather than generating an uncited fallback.

## Structured RAG data engine

- Recorded ADR 0007: PreSeed's RAG layer is an internal structured data engine, not a chatbot. The evidence-answer operation is retained only as a deprecated evaluation/backwards-compatibility surface. The number was chosen after Oran's accepted behavior-score ADR occupied ADR 0006 on `main`.
- Added `POST /v1/data-engine/semen-profile/compile` and `GET /v1/data-engine/semen-profile/current`. Compilation reads persisted account inputs, normalizes measurements, transparently derives total and motile counts when their measured operands exist, and marks those values as derived rather than predicted.
- Retrieval now fans out into a global profile query and parameter-specific queries. Results from approved evidence are fused, rank-adjusted, deduplicated, and capped before schema-constrained synthesis.
- Added a closed semen-profile schema for summary, parameter contexts, mechanisms, improvement opportunities, protocol suggestions, collection cautions, missing inputs, clinical escalations, and limitations. The server rejects invented marker/evidence IDs, and evidence-backed suggestions require at least one retrieved evidence ID.
- Added immutable, account-scoped `semen_profiles` artifacts with source-test provenance, normalized measurements, synthesis, evidence IDs, model IDs, prompt version, timestamp, and transactionally serialized version numbers. Existing artifacts are never overwritten.
- Expanded canonical lab marker support for total motile count, progressive motile count, and seminal leukocytes. WBC is correctly represented as a semen leukocyte marker, not an endocrine hormone.
- No frontend data-engine integration was made: it is intentionally deferred until the updated frontend PR lands.
- Verification: 16 Edge tests pass, documentation contracts and strict TypeScript pass, the migration applies locally, PostgreSQL lint reports no errors, targeted project lint has no errors (two pre-existing instrumentation warnings), and the production Next.js build passes. Repository-wide ESLint currently traverses generated output inside an unrelated `.claude/worktrees/capacitor` tree and therefore reports generated-code errors; that tree was left untouched.

## Synthetic pipeline exercise

- Added an idempotent `supabase/seed.sql` containing one explicitly synthetic demo account, two semen reports, one hormone panel, onboarding context, and 15 measured markers. No real personal or health data is present.
- The latest synthetic semen report contains volume 2.2 mL, concentration 14 million/mL, progressive motility 28%, total motility 39%, morphology 4%, DNA fragmentation 32%, and seminal leukocytes 1.2 million/mL. The hormone fixture contains FSH, LH, and total testosterone with illustrative laboratory intervals.
- Ran the seed repeatedly without duplicate domain rows. The fixture contains three reports and 15 markers after reruns.
- Exercised application normalization: total count derived as 30.80 million, total motile count as 12.01 million, and progressive motile count as 8.62 million. Derived values are marked `derived`; low concentration/motility and elevated DNA fragmentation are correctly contextualized against the supplied intervals.
- Added `scripts/data-engine-smoke.mjs`. It obtains local credentials internally, authenticates only the synthetic user, sends no tokens to output, and records only status, latency, stable error code, artifact counts, and request-ID propagation.
- Two authenticated compilation attempts failed closed with `503 DATA_ENGINE_NOT_CONFIGURED` because the local Edge runtime has no `OPENAI_API_KEY`. The current-artifact request correctly returned `404 SEMEN_PROFILE_NOT_FOUND`; no fabricated or partial artifact was persisted. Request IDs matched response envelopes in every run.
- The local evidence table contains six approved passages and zero embeddings. A complete live retrieval/synthesis result is therefore not claimed. Provider configuration and approved-evidence ingestion are the two remaining prerequisites.
- Verification after adding the fixture: 17 Edge tests pass, including the exact synthetic normalization and derived-count assertions.

## Finished frontend integration

- Merged Oran's finished frontend series from `main` (PRs 11–15) into the data-engine branch. Preserved its deterministic Ask PreSeed evidence-card router; the RAG response provider is not used as a chatbot or prose surface.
- Resolved the accepted-ADR number collision by retaining Oran's behavior-score surface as ADR 0006 and renumbering the structured RAG data-engine decision to ADR 0007 without changing its decision.
- Connected clinical-result save to the Edge API: create the report, persist canonical marker units, and compile a new immutable semen-profile artifact after semen reports. If the engine is unavailable, the prototype still keeps its local result and states that processing is unavailable.
- Added authenticated-or-public-demo browser access to current and compile profile operations. Access tokens are read from the existing Supabase session when present and are never logged.
- Clinical Profile now renders the structured profile summary and per-parameter emphasis/improvement opportunities. Protocol renders schema-constrained suggestions with evidence-backed versus general-guidance status. Both consume persisted artifacts; neither depends on chat history.
- Unified the frontend's white-blood-cell marker with the canonical `seminal_leukocytes_million_ml` API/database code and retained its consumer-facing label.
- Verification after integration: strict TypeScript and documentation checks pass; 23 Edge/readiness tests pass.

## Authenticated showcase onboarding

- Added ADR 0008, which makes account authentication and RLS the hosted showcase boundary again while retaining public demo mode only as an explicit configuration switch.
- Restored `/start/account` as a real Supabase email/password sign-in and sign-up screen. Successful authentication resets device-local prototype state and starts the existing ten-step onboarding flow from privacy and consent.
- Added a session-aware Next.js proxy that redirects unauthenticated product and onboarding requests to sign-in while leaving the landing page and health operation public.
- Updated consent copy from shared-public-demo language to account-scoped synthetic-showcase language.
- The onboarding review now persists the selected track and questionnaire answers through the authenticated Edge API before moving to simulated clinical-result entry.
- The built-in simulated semen report uses the authenticated clinical-test and marker operations and then invokes structured profile compilation. No showcase password is embedded in source or documentation.
- The Vercel session proxy fails closed when browser-safe Supabase configuration is absent. Production now defines the Supabase URL and publishable key; secret/service-role keys remain server-only and are not present in Vercel browser configuration.
- For the general track, completing onboarding now writes the built-in simulated semen report and hormone panel through the authenticated clinical API, attempts structured profile compilation, and opens Results. Provider/index failure does not erase the clearly simulated local showcase state.
