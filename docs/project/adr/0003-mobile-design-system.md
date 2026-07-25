# ADR 0003: Mobile-first design system with separated clinical outputs

- Status: Accepted
- Date: 2026-07-25

## Context

PreSeed presents clinical measurements, behavioural scores, model-derived risk
estimates and data-quality information to a non-clinical audience, about a sensitive
subject, from a research prototype that is not a medical device.

The dominant pattern in consumer fertility and health products is a single composite
score. It merges values with different epistemic status — what a laboratory measured,
what a user can change, what a model guesses, and how much of any of it is
trustworthy — into one figure that feels authoritative and is not defensible. The
research base for this product is explicit that these must stay separate, and the
edge-API contract already encodes that separation in its clinical output invariants.

The product also needs daily adherence over roughly 100 days. The most effective
retention mechanics in consumer software — streaks and loss aversion — are
inappropriate here: a missed day inside a sperm-production cycle of roughly 64 to 74
days carries no clinical meaning, and streak-shaming a man reading a below-reference
result is indefensible.

Several capabilities the interface must eventually present do not exist. Machine
learning runs separately on a founder's laptop; assessment, adaptation and coach
contracts are reserved; there is no evidence registry, recommendation engine, upload
extraction, wearable connection or export operation. An interface that hid those gaps
would misrepresent backend readiness to anyone demonstrating or extending it.

## Decision

Adopt a mobile-first responsive design system implemented in the existing Next.js
application, specified in `docs/design/`, with the following binding rules.

**Four outputs stay separate.** Measured clinical profile, modifiable readiness score,
named screening risks and data confidence are presented as four visually distinct
outputs in a fixed order. No composite score is derived from them. Missing data
reduces data confidence and never reduces readiness. Non-modifiable conditions never
produce behavioural deductions. Clinical gates are returned separately from scores,
render above them, cannot be dismissed, and are structurally incapable of being
averaged away.

**Every recommendation carries its reasoning.** Recommendations render as a four-station
chain — user result, mechanism, bounded action, evidence and limits — and cannot
render without the measured result that produced them. Evidence carries a review
status; only internally reviewed claims may back a recommendation, and unverified
research candidates are styled so they cannot be mistaken for approved claims.

**Absence is designed.** Any capability without a contract renders a named
pending-integration state identifying the missing dependency, visible before
interaction rather than after it. Simulated data is labelled wherever it appears and
caps data confidence. Azoospermia screening is permanently unavailable by design
rather than pending.

**Colour is never the sole carrier of meaning.** Every state is a tone, glyph and word.
There is no reward colour; warm hues are reserved for attention and escalation. The
approved status vocabulary replaces judgement language.

**Consistency is a rolling window, not a streak.** Adherence is reported as a
percentage over a trailing window, so there is no unbroken count to lose.

**Tokens are semantic and verified.** Colour, type, spacing, radius, elevation, motion
and chart roles are CSS custom properties with semantic names; no component references
a raw value. Contrast is computed rather than estimated, and the categorical chart
palette is validated for colour-vision safety. Target is WCAG 2.2 AA.

## Consequences

The team gets a production-usable token layer, a component library and 35 implemented
screens that demonstrate the complete user loop, including the states that occur when
data or backends are missing. Design decisions are auditable against the research base
and the edge-API invariants rather than resting on taste.

The cost is that the interface is more conservative than competitors. It shows four
numbers where others show one, refuses to attribute measured change to the product,
declines the strongest known retention mechanic, and displays empty states where a
competitor would display an estimate. Each of those choices makes the product less
immediately compelling and more defensible; they are the reason the product can carry
clinical content at all.

Readiness and data-confidence calculations currently exist as clearly labelled
prototype presentation logic in the client. That logic is not the production engine
and must be replaced by a versioned, server-side, clinically reviewed rules engine
writing append-only score snapshots. Until it is, any readiness figure shown is a
design placeholder, and the interface says so through its rule-version badge.
