# ADR 0007: Treat RAG as a structured product data engine

- Status: Accepted
- Date: 2026-07-25

## Context

ADR 0004 selected vector retrieval and grounded generation instead of a trained diagnostic model. The first implementation exposed that capability as an evidence question-and-answer route. That interface is useful for evaluation, but it does not represent the PreSeed product: PreSeed is not a chatbot.

The product needs one governed transformation from a user's laboratory report and account context into durable feature data. Results, reasoning chains, improvement opportunities, protocol generation, progress views, retest comparisons, and later adaptations must consume the same structured interpretation rather than independently prompting a model.

## Decision

Implement RAG as an account-scoped data engine. A compile operation reads persisted clinical tests and onboarding context, normalizes measured values, derives only transparent arithmetic fields, retrieves approved evidence with a global query plus parameter-specific queries, and asks the response provider for a closed-schema semen-profile synthesis.

The engine stores an immutable, monotonically versioned `semen_profiles` artifact containing source test IDs, normalized measurements, structured synthesis, retrieved evidence IDs, model IDs, prompt version, and creation time. Creation is transactional and serialized per account. Product features read the latest artifact or a specific historical version; they do not depend on chat history.

The synthesis schema separates parameter context, mechanisms, improvement opportunities, protocol suggestions, collection cautions, missing inputs, clinical escalations, and limitations. Evidence-backed suggestions require retrieved evidence IDs. General guidance must be labelled as such. The server rejects marker codes or evidence IDs outside its input allowlists.

The engine does not diagnose or predict azoospermia or endocrine disease, recommend hormone treatment, confirm a zero count, promise parameter improvement, or guarantee conception. Deterministic normalization may calculate total count and motile counts from measured operands; derived values are explicitly marked and are not model predictions.

The existing evidence-answer route remains temporarily available for evaluation and backwards compatibility, but is deprecated as a product interface. Frontend integration follows the finished frontend merge and must consume structured artifacts rather than chat history.

## Consequences

All PreSeed features can share one reproducible account artifact and its evidence provenance. Retests can create new versions without mutating prior interpretations. Retrieval and generation remain independently evaluable, and the UI can render feature-specific views without exposing a chatbot.

Compilation requires an available embedding provider, approved indexed evidence, and a schema-capable response model. The artifact remains a research-prototype interpretation rather than a clinical diagnosis. Changes to normalization rules, the synthesis schema, prompt, or evidence corpus must be versioned so historical outputs remain explainable.
