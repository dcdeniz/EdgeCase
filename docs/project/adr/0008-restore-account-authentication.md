# ADR 0008: Restore account authentication for the showcase

- Status: Accepted
- Date: 2026-07-26

## Context

ADR 0005 introduced an intentionally public, shared demo mode for a frictionless hackathon preview. The showcase now needs to demonstrate the complete account onboarding flow and keep each user's onboarding answers, simulated clinical reports, structured profiles, and protocols attached to that account.

## Decision

Disable `PUBLIC_DEMO_MODE` in the hosted showcase and deploy the Edge API with gateway JWT verification. Restore Supabase email/password authentication at `/start/account` and protect onboarding and product routes with a session-aware Next.js proxy.

After authentication, retain the existing onboarding screens. The final review persists the selected fertility track and answers through `PUT /v1/onboarding` before clinical-result entry. Simulated reports use the same authenticated clinical-test, marker, and data-engine operations as manually entered reports and remain visibly labelled simulated.

Keep the public-demo implementation available only as an explicit local/hackathon configuration switch; it is not the hosted default.

## Consequences

The showcase demonstrates the real account-to-onboarding-to-report data flow and RLS becomes the active account-isolation boundary again. Users must sign in before viewing product routes. The team must maintain a showcase account and must not embed its password in source, documentation, deployment variables, or logs.
