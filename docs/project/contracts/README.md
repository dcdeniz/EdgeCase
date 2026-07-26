# Contracts

`http/openapi.yaml` defines Edge Function HTTP behavior, `database/schema.sql` is a review snapshot, and `env.md` defines variable names and visibility. [`google-health-callback.md`](google-health-callback.md) defines the isolated OAuth callback boundary. [`elevenlabs-daily-checkin.md`](elevenlabs-daily-checkin.md) defines the copy-ready voice-agent system/dispatch prompt and its not-yet-implemented tool boundary. OpenAPI and migrations take precedence over prose.

[`edge-api/`](edge-api/README.md) proposes the contracts-first Supabase Edge API, Fastify portability boundary, and on-edit drift model. It remains prose until ADR 0002 is accepted and executable schemas replace the capability map.
