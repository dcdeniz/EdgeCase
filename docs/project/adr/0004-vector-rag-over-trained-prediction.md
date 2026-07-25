# ADR 0004: Use vector RAG instead of a trained prediction model

- Status: Accepted
- Date: 2026-07-25

## Context

PreSeed needs to explain how a user's entered measurements and onboarding context relate to an approved fertility evidence library. The hackathon does not yet have a governed training dataset, reliable labels, calibration evidence, subgroup-performance evaluation, or a clinically reviewed target definition for azoospermia or endocrine disorders.

A lightweight linear model would make a numerical prediction easy to demo but difficult to justify. It could learn dataset-specific prevalence and referral patterns, turn missingness into spurious signal, and present a score that looks diagnostic without being clinically validated. Vector retrieval solves a different, currently supportable problem: finding relevant reviewed evidence and grounding an explanation in it.

## Decision

Use pgvector retrieval over a versioned, reviewed evidence library. Build the retrieval query from the authenticated user's question, onboarding track, and recent measured results inside the Edge Function. Send only the retrieved evidence and minimum necessary account context to the response provider.

The response must satisfy a closed JSON Schema. Every returned evidence ID must be a member of the retrieved set; the server adds citation titles and URLs from Postgres rather than trusting model-generated citation metadata. Store the retrieved IDs, prompt version, models, structured answer, user ID, and timestamp in an account-scoped audit record.

The system produces evidence-grounded explanation and risk guidance, not prediction or diagnosis. It must never confirm or predict azoospermia, diagnose an endocrine disorder, recommend hormone therapy, promise a parameter change, or guarantee conception. Azoospermia requires qualified laboratory examination including centrifuged sediment; concerning hormone or semen results require clinical escalation.

Use `text-embedding-3-small` with 1,536 dimensions for the initial index and a configurable Responses API model for synthesis. Provider names and model IDs are environment configuration. Evidence ingestion is an explicit privileged script using the Supabase secret key; the runtime API uses the caller's JWT and RLS.

## Consequences

The hackathon can demonstrate personalised, cited reasoning without inventing a predictive model. New evidence can be reviewed, versioned, embedded, and retrieved without retraining. Retrieval and response quality can be evaluated independently.

Vector RAG cannot estimate disease probability or replace a diagnostic model. Its quality is bounded by the curated library, embedding recall, and response validation. A future predictive model is not prohibited, but requires a new decision record and evidence that its labels, calibration, intended use, and clinical escalation behavior are defensible.
