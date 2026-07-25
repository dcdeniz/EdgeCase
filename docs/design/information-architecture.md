# Information architecture

- Status: Implemented
- Last updated: 2026-07-25

## Principles

1. **One question per screen.** Today answers "what do I do now". Results answers
   "what is known about me". Nothing competes with the answer.
2. **Measurement, behaviour, prediction and data quality never merge.** They are
   four destinations within Results, in that fixed order.
3. **Depth is disclosed, not navigated.** A user reaches mechanism, evidence strength
   and study detail by expanding in place, not by losing their position.
4. **The track changes emphasis, never the claims.** Track selection swaps the third
   destination and reorders urgency. It does not change what PreSeed is willing to say.

## Primary navigation

Five stable destinations in a bottom bar. The third adapts to the selected track.

| Slot | General | Vasectomy reversal | Pre-treatment preservation |
| --- | --- | --- | --- |
| 1 | Today | Today | Today |
| 2 | Results | Results | Results |
| 3 | **Protocol** | **Tracking** | **Priority** |
| 4 | Evidence | Evidence | Evidence |
| 5 | Account | Account | Account |

The AI coach is **not** a destination. "Ask PreSeed" is an action available on a
measured result, a risk output, a readiness domain, a recommendation, a protocol item
and an evidence card. It always opens with visible context (`Discussing: progressive
motility result`) and returns the user where they came from.

### Navigation rules

- The bar is fixed, with `env(safe-area-inset-bottom)` padding.
- The active destination carries `aria-current="page"`, an accent colour **and** a
  position marker under the glyph, so the active state survives forced-colors mode.
- Every tab target is at least 64px tall and one fifth of the viewport wide.
- Linear flows (signup, onboarding, test entry, check-in) replace the bar with a
  progress rail and a single sticky commit bar. The user has one job in those flows.

## Hierarchy

```text
Welcome  ─ the reasoning chain, performed
│
├── Start ─────────── Account → Privacy → Consent → Disclaimer → Track
│
├── Onboarding ────── Goal → Lifestyle → Clinical history → Exposure → Review
│                     (reversal skips Goal and Lifestyle; preservation skips all)
│
├── Today ─────────── clinical gates · adaptation proposal · protocol day
│                     today's actions · consistency · check-in entry
│                     readiness summary · latest result
│
├── Results ───────── 1 Clinical profile ──→ marker detail ──→ trend, provenance
│                     ▸ Parameter reasoning ─→ reasoning chain (signature)
│                     2 Readiness score ────→ domain breakdown
│                     3 Screening risks ────→ four endpoint states
│                     4 Data confidence ────→ factors and what raises them
│                     └ Trends ─────────────→ baseline to latest
│
├── Protocol ──────── progress · retest prompt · current actions
│                     consistency · week-by-week timeline · adaptation
│                     └ Check-in ──────────→ log actions → two questions
│
├── Evidence ──────── library, filtered by review status
│                     └ Evidence card ─────→ claim, endpoint, limits, source
│
├── Account ───────── Display and accessibility
│                     Your data · provenance, consent, deletion
│                     Safety centre · limits and escalation
│                     Demo controls (prototype only)
│
├── Coach ─────────── contextual, entered from any of the above
│
└── Tracks ────────── Reversal tracking │ Preservation priority
```

## Where each of the four outputs lives

| Output | Home | Detail | Also surfaces on |
| --- | --- | --- | --- |
| Clinical profile | `/results` section 1 | `/results/profile`, `/results/profile/[code]` | Today (latest result card), Trends |
| Readiness score | `/results` section 2 | `/results/readiness` | Today, onboarding review |
| Named screening risks | `/results` section 3 | `/results/risks` | — |
| Data confidence | `/results` section 4 | `/results/confidence` | Account → Your data |

## Content hierarchy rules

**Clinical gates render above every score.** On Today and on the readiness detail
screen, a gate appears before the readiness card. This is structural: a composite
average cannot cancel a gate because gates are not points.

**Simulated provenance travels with the data.** Any list, card, chart or comparison
built on demonstration data carries a simulated badge, and simulated provenance caps
data confidence.

**The persistent disclaimer is a label, not a wall.** A compact `Prototype ·
Simulated` control sits in every header and opens the full disclaimer plus a route to
the safety centre. Long-form legal text appears once, on the disclaimer step, and
once in the safety centre. Screens carry a single-line footer, not a paragraph.

## Screen inventory

35 routes. `†` marks screens on the hackathon critical path.

### Entry and consent

| Route | Screen | Notes |
| --- | --- | --- |
| `/` | Welcome † | Hero is the reasoning chain, performed |
| `/prototype` | Screen map | Connected index; demo state loader |
| `/start/account` | Create account or sign in † | |
| `/start/privacy` | Privacy summary † | What is stored, what never is |
| `/start/consent` | Health-data consent † | Explicit, withdrawable |
| `/start/disclaimer` | Research-prototype disclaimer † | The one list-reading screen |
| `/start/track` | Track selection † | States what each track changes |

### Onboarding

| Route | Screen | Notes |
| --- | --- | --- |
| `/onboarding/goal` | Goal and timeline † | Protocol length and retest date update live |
| `/onboarding/lifestyle` | Lifestyle † | Sleep, nicotine, alcohol, diet, activity, heat |
| `/onboarding/health` | Clinical history † | Conditions, medicines, sexual health; fires clinical gates |
| `/onboarding/exposure` | Environmental exposure † | Tiered by evidence strength |
| `/onboarding/review` | Review † | First readiness score, behaviour only |

### Clinical

| Route | Screen | Notes |
| --- | --- | --- |
| `/tests/new` | Add a clinical result † | Three modes, one surface, three steps |
| `/results` | Results hub † | The four outputs, kept distinct |
| `/results/profile` | Clinical profile † | Measured values and comparability |
| `/results/profile/[code]` | Marker detail † | Reference strip, trend, provenance |
| `/results/readiness` | Readiness detail † | Domains, drivers, gates, rule version |
| `/results/risks` | Screening risks † | All four states |
| `/results/confidence` | Data confidence † | Factors and what raises them |
| `/results/reasoning/[id]` | Parameter reasoning † | The signature screen |
| `/trends` | Trends † | Baseline to latest, with variability |

### Protocol

| Route | Screen | Notes |
| --- | --- | --- |
| `/today` | Today † | One question, answered — plus today's logged data |
| `/protocol` | Protocol † | Progress, actions, timeline, versions |
| `/protocol/check-in` | Check-in † | Log actions, then two questions |

### Behaviour and logged data

Added by [ADR 0006](../project/adr/0006-behaviour-score-surface.md). Reached from
Today rather than from a sixth navigation slot, which stays at five.

| Route | Screen | Notes |
| --- | --- | --- |
| `/score` | Fertility readiness | Weekly and yearly score, baseline delta, year grid, four domains |
| `/sleep` | Sleep | Hypnogram, stages, seven-night duration. Simulated |
| `/food` | Food | Camera capture with a confirmation loop, pattern score |
| `/goals` | Goals | Behavioural targets against logged data. No clinical targets |

Today additionally carries the SemenProfile board and parameter contributors
([mapping](parameter-contributors.md)).

### Tracks

| Route | Screen | Notes |
| --- | --- | --- |
| `/reversal` | Reversal tracking | Longitudinal, mandatory azoospermia notice |
| `/preservation` | Preservation priority | Urgency and navigation only |

### Evidence and explanation

| Route | Screen | Notes |
| --- | --- | --- |
| `/evidence` | Evidence library † | Filtered by review status |
| `/evidence/[id]` | Evidence card † | Claim, endpoint, limitations, source |
| `/coach` | Ask PreSeed † | Contextual, with citations and limits |

### Account and handoff

| Route | Screen | Notes |
| --- | --- | --- |
| `/account` | Account | Includes clearly separated demo controls |
| `/account/display` | Display and accessibility | Theme, text size, motion, contrast |
| `/account/data` | Your data | Provenance, export, consent, deletion |
| `/account/safety` | Safety centre | Limits, escalation, and how the UI protects |
| `/design` | Design system reference | Live tokens, components and states |

## Responsive behaviour

Designed at a 390pt viewport first.

| Width | Behaviour |
| --- | --- |
| < 480px | Single column, content at `100%` inside 16px gutters |
| 480–768px | Content column capped at `--ps-shell-max` (30rem) and centred; sheets gain a bottom margin and full radius |
| > 768px | Unchanged. The app remains a centred mobile column; no desktop layout is invented, because none is designed |

Every layout uses flow and wrapping rather than fixed heights, so a 150% text scale
reflows instead of clipping. Wide content — tables, charts — scrolls inside its own
container; the page body never scrolls horizontally.
