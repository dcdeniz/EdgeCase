# ADR 0005: Expose a shared public hackathon mode

- Status: Accepted
- Date: 2026-07-25

## Context

The hackathon demonstration prioritises immediate access over account creation, privacy, tenant isolation, or production readiness. The product owner explicitly accepted public routes and shared records for this prototype.

## Decision

Add an explicit `PUBLIC_DEMO_MODE`. When enabled, the Supabase API Function is deployed without gateway JWT verification, does not require bearer authentication, accepts browser origins, and uses the built-in service-role credential with one configured `PUBLIC_DEMO_USER_ID`. All visitors therefore read and write the same demo user's records.

Remove the visible login screen. Replace privacy and health-data-consent claims with a prominent warning that the environment is shared, public, and suitable only for simulated data.

Keep the normal authenticated/RLS code path intact behind the environment switch so production privacy can be restored without rewriting domain operations.

## Consequences

The demo is frictionless and has no privacy or integrity boundary between visitors. RLS remains defined in PostgreSQL but is bypassed by the public API's service-role client. Anyone can overwrite shared demo records or consume configured AI quota. Real health data, identifiers, credentials, and documents must never be entered. Before any non-hackathon deployment, disable public demo mode, restore gateway JWT verification, rotate secrets, and clear shared records.
