# PreSeed mobile design system

- Status: Implemented as a clickable prototype
- Last updated: 2026-07-25
- Scope: Complete mobile UI/UX — information architecture, flows, screens, components, tokens, states, accessibility and handoff specification

The prototype is a responsive mobile web application built on the existing Next.js
app. Run `npm run dev` and open `/prototype` for the connected screen map, or
`/design` for the live token and component reference.

## Documents

| Document | Contains |
| --- | --- |
| [Design rationale](#design-rationale) | Below — the argument behind the visual and structural choices |
| [Market inspiration](market-inspiration.md) | What Strava, Duolingo and Cal AI decided, and what PreSeed refuses |
| [Information architecture](information-architecture.md) | Navigation, hierarchy, track behaviour, screen inventory |
| [User flows](flows.md) | End-to-end flows, the critical path, and decision points |
| [Wireframes](wireframes.md) | Low-fidelity layouts for every primary screen |
| [Screen specifications](screens.md) | Per-screen objective, data, actions, states and API dependency |
| [Component inventory](components.md) | Every reusable component with its props, states and rules |
| [Design tokens](tokens.md) | Colour, type, spacing, radius, elevation, motion, charts — with measurements |
| [Interaction specification](interaction-spec.md) | Behaviour, transitions, gestures, feedback and error handling |
| [Accessibility](accessibility.md) | WCAG 2.2 AA checklist with the verification performed |
| [Backend and ML dependencies](dependencies.md) | What is implemented, what is pending, and the open product decisions |

## Design rationale

### The problem this design solves

Male fertility products fail in one of two directions. Clinical tools present data
without meaning, leaving a man with numbers he cannot act on. Consumer wellness apps
present meaning without data, leaving him with confident advice that has nothing
behind it. Both are comfortable positions to occupy. Neither is honest.

PreSeed's whole proposition is that it refuses the trade: it shows the measurement
*and* the reasoning, including where the reasoning runs out. That refusal is the
design brief, and it produces three consequences that shape everything else.

### 1. Four outputs, never one number

The single most damaging pattern available here is a composite "fertility score". It
merges what a laboratory measured, what a man can change, what a model guesses, and
how much of any of it is trustworthy — four things with completely different
epistemic status — into one figure that feels authoritative and means nothing.

So the results architecture keeps them apart and *visually distinct*, in a fixed
order that encodes their reliability:

1. **Clinical profile** — measured values, with unit, provenance, verification,
   reference context and collection conditions.
2. **Readiness score** — a transparent 0–100 on modifiable behaviours, carrying the
   sentence "This reflects modifiable behaviours, not measured sperm quality" on
   every surface it appears.
3. **Named screening risks** — specific endpoints with bands, uncertainty and model
   version. Mostly absent, and honest about being absent.
4. **Data confidence** — how much trustworthy information sits under the other three.

The fourth exists so the other three never have to lie. Missing data lands on
confidence, which means the readiness score only ever moves when behaviour does, and
adding a hormone panel never looks like a health improvement.

The behaviour score at `/score` ([ADR 0006](../project/adr/0006-behaviour-score-surface.md))
is the second of these four rendered at greater density — weekly, yearly, and
across four logged domains. It is a composite, but strictly *within* output two:
no clinical value, prediction or confidence term enters it, so it does not
collapse the separation this section is about. That exclusion is the whole
justification, and it is enforced in `src/lib/behaviour-score.ts`.

### 2. The reasoning chain is the product

The signature screen renders one argument as four typed stations on a rail:

> your specific result → the mechanism → a bounded action → the evidence and its limits

The numbering is meaningful rather than decorative: the argument genuinely runs in
that order, and a recommendation is structurally incapable of appearing without the
result that produced it. Progressive disclosure keeps each station shallow by
default — "Why this applies to me", then mechanism, then evidence strength, then
study detail, then limitations, then clinical escalation where relevant.

This is also the retention mechanic. Where Duolingo motivates with what you might
lose and Strava with who you might beat, PreSeed motivates with how precisely it can
explain *your* result. That is the only engagement loop that survives the bad-news
test described in [market inspiration](market-inspiration.md).

### 3. Warmth means "look here", never "well done"

The palette carries no encouragement colour. Strava's orange and Duolingo's green
both signal activity and reward; applied to a man reading a below-reference motility
result, that register is grotesque. So:

- The accent is a low-chroma deep teal that reads as **instrument**, not applause.
- Warm hues are reserved exclusively for **attention** and **escalation**, so warmth
  in this product always means *look here*.
- There is no red/green scoring anywhere. The reference strip — the most important
  clinical mark in the system — is neutral graphite throughout, with position and
  words carrying the meaning.

Approved vocabulary replaces judgement: *within reference context*, *below reference
context*, *needs attention*, *insufficient data*, *confirmation required*,
*simulated*. Never *bad*, *failing*, *abnormal* or *infertile*.

### 4. Three type registers with declared jobs

The typographic system is the least conventional decision here, and the one doing the
most work.

| Register | Face | Job |
| --- | --- | --- |
| Measurement | IBM Plex Sans, tabular figures | Anything measured, scored or counted |
| Explanation | Newsreader | Anything reasoned, cited or qualified |
| Machine metadata | IBM Plex Mono | Marker codes, model versions, rule versions, identifiers, timestamps |

The register tells you what kind of claim you are reading before you read it. A
serif paragraph is an argument that can be disagreed with; a tabular figure is a
recorded fact; a mono string is something a system produced. This borrows Duolingo's
*discipline* — each face has a declared job and a size floor — while taking none of
its shapes.

### 5. Absence is designed, not left over

Roughly a third of this system specifies what happens when there is nothing to show:
pending integration, insufficient data, not available by design, not measured,
externally generated, offline, evidence insufficient, explanation unavailable.

Each has a distinct visual treatment, and each is visible *before* interaction. This
comes directly from the Strava critique: constraints must guide behaviour before
effort is invested, not after. A screening risk that looks live until you tap it is
worse than one that never appeared.

The strongest example is azoospermia screening, which is permanently unavailable *by
design* rather than pending. It renders with the mandatory message and no path to a
result, because there is no engineering work that would ever make it available.

### 6. Consistency without a streak

Adherence is a rolling-window percentage over the last 14 days, not an unbroken
count. A window metric cannot be broken, so there is nothing to shame, no freeze to
sell, and a two-week holiday reads as a gap in the record rather than a failure.

The year grid added by [ADR 0006](../project/adr/0006-behaviour-score-surface.md)
does not change this. It is a *record* of logged days, with no current-streak
count, no longest-streak count and no loss-aversion copy; the rolling window
remains the headline number. Adding a consecutive-day count to it would
reintroduce the mechanic this section exists to refuse.

This is a deliberate rejection of the most effective retention mechanic in consumer
software, on three grounds: it converts a health behaviour into a debt; a missed day
inside a 100-day protocol is clinically meaningless given a 64–74 day sperm
maturation cycle; and a broken-streak screen on the day a result comes back below
reference is cruel and pointless.

### 7. Track selection changes the product, not the claims

Three tracks change urgency, navigation and whether a 100-day protocol is even the
right shape:

- **General** — Protocol is the third tab; the dated plan is the spine.
- **Vasectomy reversal** — Tracking replaces Protocol. Longitudinal laboratory
  results, four-week reminders, recovery context, and the mandatory azoospermia
  notice on every screen. Deliberately not gated behind the 100-day flow.
- **Pre-treatment preservation** — Priority replaces Protocol, and onboarding is
  *skipped entirely*. This is a navigation and urgency problem, not a measurement
  one. Asking a man facing chemotherapy about his sleep before telling him to call a
  fertility specialist would be a design failure with real consequences.

### What was deliberately not done

- No mascot, no baby imagery, no sperm iconography.
- No gauge, dial or ring for **clinical** scores — those read as game scores.
  Narrowed by [ADR 0006](../project/adr/0006-behaviour-score-surface.md): a ring
  is permitted for the behaviour score, which contains no clinical measurement,
  prediction or confidence term, and which cannot render without its caveat.
  Marker values, risks and confidence keep their existing flat treatments.
- No seven-colour category system for protocol categories; they are distinguished by
  their words, which also keeps the chart palette uncontested.
- No live model inference, no invented endpoints, no percentage probabilities.
- No supplement recommendation, because the effect sizes in circulation have not been
  traced to their papers. They appear as a research candidate that is styled so it
  cannot be mistaken for an approved claim.

## Verification performed

- Every ink and status colour role clears **4.5:1** against every surface in both
  themes; control borders clear **3:1**. Computed, not estimated.
- The three-slot chart palette passes all six categorical checks — lightness band,
  chroma floor, CVD separation, normal-vision floor, contrast — in both themes, under
  the all-pairs rule.
- `npm run check` and `npm run build` pass. 35 routes generate.
