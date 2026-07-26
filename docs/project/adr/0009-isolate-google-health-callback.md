# ADR 0009: Isolate the Google Health OAuth callback

- Status: Accepted
- Date: 2026-07-26

## Context

ADR 0008 restored gateway JWT verification for the authenticated showcase. Google Health redirects browsers with an authorization code and state but cannot attach a Supabase bearer token. Supabase configures gateway verification per function, not per route.

## Decision

Keep gateway JWT verification on the primary `api` function and create a separate `google-health-callback` function without gateway JWT verification. The authenticated connect operation creates a state containing the account UUID, random nonce and ten-minute expiry, authenticated with HMAC-SHA256 using the server-only OAuth client secret. The callback accepts only a valid state, exchanges the one-time code, and stores tokens using the service role.

Request only read scopes for activity, health measurements and sleep. Disable real-data connection in public demo mode. Store provider tokens in an RLS-enabled table with all `anon` and `authenticated` privileges revoked; expose normalized daily summaries through owner-scoped RLS. Missing provider observations remain null.

## Consequences

The authenticated API retains gateway defense in depth and the unauthenticated surface is reduced to one narrowly validated callback. A second function adds one deployment artifact and requires its URL to be registered exactly in Google Cloud.

Provider tokens are service-only but stored as plaintext database values for the hackathon. Before production or external testing, encrypt tokens with a separately managed key, add disconnect/deletion and refresh-token revocation, and complete Google's restricted-scope privacy/security review.
