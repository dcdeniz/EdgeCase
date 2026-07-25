# Backend and ML dependencies, and open decisions

- Status: Current as of 2026-07-25
- Canonical sources: [edge API contract](../project/contracts/edge-api/README.md),
  [OpenAPI](../project/contracts/http/openapi.yaml), [ADR 0002](../project/adr/0002-fastify-service-boundary.md)

The prototype runs on local state and fixtures. It does not call the Edge API,
because the implemented contract covers roughly half of what the interface shows and
wiring the rest would mean inventing endpoints. Every screen that depends on
something unbuilt says so in the interface, not only here.

## What the implemented contract already supports

These screens could be wired to the deployed `api` function without any new contract.

| Capability | Operation | Screens |
| --- | --- | --- |
| Session | `getMe` | Account, Your data |
| Onboarding | `putOnboarding` | Track, all onboarding steps, review |
| Clinical test create | `createClinicalTest` | Test entry |
| Marker upsert | `putClinicalMarkers` | Test entry |
| Test list | `listClinicalTests` | Clinical profile, Your data, reversal tracking |
| Test detail | `getClinicalTest` | Marker detail |
| Protocol create | `createProtocol` | Protocol generation |
| Active protocol | `getCurrentProtocol` | Today, Protocol |
| Adherence | `putAdherenceEvent` | Today, Protocol, Check-in |
| Check-in | `createCheckIn` | Check-in |
| Trends | `getTrends` | Trends, reversal tracking, marker detail |
| Evidence detail | `getEvidence` | Evidence card |

Note that `createProtocol` requires the *client* to supply items. In the prototype
those come from a template; in production they must come from a recommendation
engine, which does not exist.

## What is pending, and what each blocks

Ordered by how much of the interface each unblocks.

### 1 Readiness scoring — blocks 4 screens

**Status.** Not implemented. No operation exists.

**What the design assumes.** A versioned, server-side, deterministic rules engine that
writes append-only score snapshots carrying domain scores, signed drivers, time
windows, evidence confidence, missing inputs, clinical gates and a rule version.

**Prototype substitute.** `src/lib/readiness.ts`, explicitly headed *prototype
presentation logic only*. It is transparent and auditable, and it obeys the four
product invariants the real engine must also obey — behaviour only, missing data
lowers confidence not readiness, non-modifiable conditions never deduct, gates are
returned separately and cannot be averaged away.

**Blocks.** Readiness summary, readiness detail, onboarding review, Today.

**Contract needed.** `GET /v1/assessments/readiness` returning score, band, domains,
drivers, missing inputs, gates and rule version; snapshots persisted per calculation.

### 2 Data confidence — blocks 3 screens

**Status.** Not implemented.

**What the design assumes.** Six weighted factors — result provenance, recency, marker
completeness, hormone context, repeat-test comparability, behavioural log coverage —
each with a state and an explanation.

**Prototype substitute.** `computeConfidence` in `src/lib/store.tsx`.

**Blocks.** Data confidence detail, Results hub, Your data.

### 3 Screening risks — blocks 1 screen, 4 states

**Status.** Reserved. The edge-API contract states assessments are reserved until the
model-owner pull requests define inputs and outputs. ML currently runs on a founder's
laptop.

**What the design already specifies** — and this is the useful part, because it does
not depend on the model landing:

| State | Meaning | Design status |
| --- | --- | --- |
| `unavailable_by_design` | Azoospermia screening. Never available, at any point | Fully specified with the mandatory message |
| `externally_generated` | Produced off-device and imported, with model version and generation date | Fully specified, including the "did not use your data from the last six days" caveat |
| `pending_model` | No model connected for this endpoint | Renders as pending integration, not as an empty result |
| `insufficient_data` | Model exists but eligibility is unmet — e.g. no hormone panel | Fully specified with the missing inputs listed |

**Contract needed.** An assessment operation returning endpoint, band, uncertainty,
eligibility, missing inputs, model version, confirmation requirement and next action.
Plus a model registry so every prediction stores the version that produced it.

**Design constraint to preserve.** Bands, not percentages, until prospective
validation is complete. A percentage implies a calibrated individual probability the
research does not support.

### 4 Evidence registry — blocks 3 screens

**Status.** `getEvidence` exists for a single claim. No listing, no search, no
machine-readable registry.

**What the design assumes.** The registry sketched in
[the roadmap](../roadmap/README.md#evidence-registry): factor, claim, endpoints,
direction, evidence level, evidence type, causal flag, modifiable flag, maximum
readiness points, source URL, last reviewed and clinical review status.

**Prototype substitute.** 18 claims in `src/lib/fixtures.ts`, each carrying its real
source and its real review status.

**Design constraint to preserve.** Three review statuses, rendered distinctly:
`internal_review` may back a recommendation; `clinical_review_pending` is readable but
not citable; `research_candidate` is styled so it cannot be mistaken for approved and
is excluded from recommendations by construction rather than by policy.

### 5 Recommendation engine and reasoning chains — blocks the signature screen

**Status.** Not implemented.

**What the design assumes.** Recommendations selected from score gaps, evidence
eligibility, safety exclusions and goal, each carrying observation, mechanism, bounded
action, allow-listed evidence IDs, studied endpoint, limitations, exclusions and
evidence-backed/general-guidance status — which is exactly what the edge-API contract
already specifies for recommendations.

**Prototype substitute.** Three authored chains in `src/lib/fixtures.ts`.

**Blocks.** Parameter reasoning, protocol generation, the "why this is in my plan"
route from every protocol action.

### 6 Protocol adaptation — blocks 1 component

**Status.** Reserved. The contract lists adaptations as reserved until evidence and
coach contracts are implemented.

**Design constraint to preserve.** Proposed and confirmed. Accepting creates a new
version; the previous version stays on record. Never a silent rewrite.

### 7 Contextual explanation (Vector RAG) — blocks 1 screen

**Status.** Reserved for on-demand retrieval after account outputs exist.

**What the design assumes.** A retrieval layer over the approved evidence set, with
output validated against a closed schema. Per the contract, it cannot invent evidence,
change scores or gates, recommend hormone treatment, or apply adaptations without
confirmation.

**Prototype substitute.** Four authored responses covering the three designed states —
cited, evidence insufficient, explanation unavailable — plus a pending-integration
state for any context with nothing attached.

**Design constraint to preserve.** It explains existing account outputs and retrieves
approved evidence. It does not calculate scores or predictions.

### 8 Upload and extraction — blocks 1 mode

**Status.** `POST /v1/uploads/intents` and `POST /v1/uploads/:id/confirm` exist in the
capability map but not in the implemented slice. No extraction service.

**Design already specified.** A four-step confirmation flow, one reviewable list with
inline editing and a single commit, extraction confidence per value, and verification
transitioning `lab_report` → `user_confirmed` on edit.

### 9 Environment snapshots — blocks 1 panel

**Status.** `POST /v1/environment/snapshots` exists in the capability map; no AQI
provider is connected.

**Blocks.** Live air-quality tracking and same-day high-pollution nudges.

### 10 Wearables — not started

**Status.** No contract, no connection. Deliberately a stretch state.

**Design impact.** Behavioural log coverage is permanently "weak" in data confidence
because onboarding answers are self-reported at a single point in time. This is
honest, and it is also the clearest demonstration of why confidence is a separate
output.

### 11 Export — blocks 1 action

**Status.** No operation. Renders as a pending action with `aria-disabled`.

## Summary

| Area | Contract | Prototype behaviour |
| --- | --- | --- |
| Auth, onboarding, tests, markers, protocol, adherence, check-ins, trends, evidence detail | **Implemented** | Local state mirrors the shapes |
| Readiness, confidence | **Not implemented** | Transparent prototype logic, clearly labelled |
| Assessments, risks | **Reserved** | Four honest states, no computation |
| Adaptations | **Reserved** | Proposed-and-confirmed flow with fixture proposal |
| Coach | **Reserved** | Authored responses, three states |
| Evidence registry, search | **Partial** | 18 fixture claims with real sources |
| Uploads, environment, wearables, export | **Not implemented** | Pending-integration blocks naming each dependency |

## Open product decisions

These need a decision before implementation, and each changes the design.

1. **Reference-set versioning.** WHO 6th edition limits are hardcoded in the marker
   catalogue. Production needs a versioned reference-set table so a limit change is
   auditable and historical results keep the limits they were read against.
2. **Readiness weights.** The seven domain weights come from the roadmap as an
   explicit hypothesis for clinical review. They are not validated. Who signs them off,
   and what happens to existing snapshots when they change?
3. **Smoothing factor.** 0.85/0.15 is a product hypothesis. It is implemented in the
   prototype but not exercised, because there is no score history.
4. **Natural variability band.** ±25% is a presentation device chosen to be
   defensible, not a measurement-error model. It needs a clinically reviewed figure,
   probably per marker rather than one constant.
5. **Clinical review workflow.** Three review statuses are designed. Who performs
   clinical review, what evidence they see, and how a status change propagates to
   recommendations already shown to users, are undefined.
6. **Simulated-data policy at launch.** The prototype caps confidence for simulated
   results. Whether simulated data should be permitted at all outside a demo build is
   a product decision with safety implications.
7. **Protocol length default.** 100 days is the brief's default and is configurable in
   onboarding. Whether shorter options should be offered at all is unresolved — under
   60 days cannot show a change in a measurement, and offering it may imply otherwise.
8. **Reversal reminder cadence.** The prototype derives a four-week interval from the
   latest result and states the surgeon's direction takes priority. Whether the app
   should schedule reminders at all, versus recording a clinician-set schedule, needs
   a clinical view.
9. **Preservation directory sourcing.** The banking-service directory needs a verified
   source of licensed services. Listing an unlicensed or out-of-date service in this
   context would be a serious failure.
10. **Partner access.** Currently designed as impossible. Many users will want to share
    results with a partner going through IVF. Any sharing feature reopens the entire
    privacy model and should not be added casually.
11. **Notification policy.** No notifications are designed. Given the explicit rejection
    of streak mechanics, what a respectful reminder looks like — and what it must never
    say on a lock screen — needs its own design pass.
12. **Desktop.** The system is mobile-only by design and centres a mobile column on
    wide screens. Whether a genuine desktop layout is ever wanted is undecided; the
    tokens support it, the screens do not.
