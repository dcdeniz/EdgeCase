# Component inventory

- Status: Implemented
- Live gallery: `/design`
- Source: `src/components/{ui,shell,charts,domain,protocol,icons}.tsx`

Every component is specified with its purpose, key props, states and the rules that
govern it. Rules marked **Invariant** are safety-bearing and must survive refactors.

---

## Shell

### AppShell / Screen

Tabbed application chrome: skip link, live-region announcer, sticky header, main
landmark, bottom navigation.

- `Screen` composes `AppShell` + `ScreenHeader` for the common case.
- `<main id="screen" tabIndex={-1}>` is the skip-link target and is keyed on pathname
  so each navigation replays the entry animation.
- Content column: `max-w-(--ps-shell-max)`, 16px gutters, 128px bottom padding to
  clear the fixed navigation.

### BottomNav

Five destinations; the third adapts to track.

- **Invariant** — the active destination carries `aria-current="page"`, an accent
  colour **and** a position marker under the glyph, so the state survives
  forced-colors mode.
- Targets are ≥ 64px tall and one fifth of the viewport wide.
- `pad-safe-bottom` for home-indicator clearance.

### ScreenHeader

Sticky, blurred, with optional back affordance (string href or router-back),
eyebrow, title and a trailing slot defaulting to the prototype label.

### FlowShell

Linear-flow chrome for signup, onboarding, test entry and check-in.

- Progress rail **and** a numeric `step/total`, so progress is never bar-only.
- `role="progressbar"` with `aria-valuenow/min/max` and a label.
- Single sticky commit bar. No bottom navigation — the user has one job.

### PrototypeLabel

The persistent safety label. Compact chip in every header; opens a sheet with the
full disclaimer, six named limits and a route to the safety centre.

- **Invariant** — reads `Prototype · Simulated` whenever any simulated test is on
  file, `Research prototype` otherwise.

### SafetyAlert

Clinical alerts. `severity: escalation | attention`.

- **Invariant** — not dismissible, and rendered above any score on the same screen.
- `nonModifiable` adds the chip "Does not affect your readiness score".
- Left border at 2px in the severity colour, plus glyph, plus heading — three
  channels.

### DisclaimerFooter

One-line persistent disclaimer plus a link to the safety centre. Used at the foot of
tabbed screens instead of a wall of legal text.

---

## Primitives

### Button / ButtonLink

`variant: primary | secondary | quiet | escalation`, `size: md | lg`, optional
leading and trailing glyph, `full`.

- Minimum height `--ps-touch-min` (44px) in every variant.
- `secondary` uses `line-control`, so its boundary meets 3:1.

### PendingAction

An action whose backend does not exist.

- **Invariant** — uses `aria-disabled` rather than `disabled`, so it stays focusable
  and a screen-reader user can land on it and hear why it does nothing.
- Dashed border, muted ink, trailing clock glyph, and a `aria-describedby` reason
  rendered beneath it.

### Card

`tone` applies a status wash and drops the border; default is `surface-1` with a
hairline and `elevation-1`. `inset` reduces padding for row lists.

### RowLink

Navigating list row: optional glyph, eyebrow, title, detail, trailing slot, chevron.
Whole row is the target, ≥ 44px.

### SectionHeader

Eyebrow, heading (`h2` or `h3` via `level`), optional action slot. Takes an `id` so
sections can be labelled by their heading.

### MetaList

Definition list of label/value pairs. Values wear the mono register because they are
recorded facts.

### Divider

---

## Inputs

### Field

Label, hint, control, error.

- **Invariant** — the hint renders **above** the control, so autocomplete popovers
  and mobile keyboards cannot cover it.
- Errors render below with a glyph and text, never colour alone.
- `optional` renders an explicit "Optional" marker rather than marking required
  fields, since most fields here are optional.

### UnitInput

Measurement input with a rendered unit suffix.

- **Invariant** — the unit is displayed, never typed. Units are a contract, not free
  text.
- `inputMode="decimal"`, tabular numerals, `autoComplete="off"`.
- The unit block is `aria-hidden`; the accessible name comes from the label and the
  hint carries the meaning.

### TextInput / TextArea / Select

Standard controls on `controlBase`: `line-control` border, 44px minimum height,
`user-invalid:` error styling so errors appear only after a value is committed.

### ChoiceGroup

Radio or checkbox semantics with card presentation.

- `multiple` switches to checkboxes; `columns` allows a two-up grid.
- Each option supports a `note` explaining why it matters.
- **Invariant** — "None" and "Prefer not to say" are exclusive: selecting either
  clears other selections (enforced in the page-level `toggle` helper).
- Selection is carried by border, wash **and** a check glyph.

### Segmented

Mode switcher with `aria-pressed` per option. Used for the single capture surface in
test entry and for evidence filtering.

### RatingControl

1–5 scale with visible numerals and low/high anchor labels.

- **Invariant** — numbers are visible, so the scale never depends on shape or colour.
- Each cell is 44px.

---

## Disclosure and overlays

### Disclosure

Button controlling a region, with `aria-expanded` and `aria-controls`.

- **Invariant** — deliberately not `<details>`/`<summary>`, because headings inside a
  summary are dropped from screen-reader heading lists.
- Optional count, glyph and `defaultOpen`.

### Sheet

Bottom sheet on the native `<dialog>`.

- Opened with `showModal()`, so inert background content, focus containment and
  Escape handling come from the platform — no focus-trap JavaScript.
- `closedby="any"` for declarative light dismiss, with a coordinate-checking fallback
  registered only when `closedBy` is unsupported (Safari).
- Sticky header with grabber and close control; optional sticky footer with
  `pad-safe-bottom`.
- `max-h-[88dvh]`, scrolls internally.

### ConfirmSheet

Sheet preset for clinically meaningful or irreversible actions. Cancel and confirm,
with `tone: accent | escalation`.

- **Invariant** — protocol adaptation, consent withdrawal and prototype reset all go
  through it.

---

## Feedback states

### Skeleton / LoadingBlock

Shimmer skeleton matching the shape of the content it replaces. `LoadingBlock`
carries a visually-hidden label naming what is loading.

- **Invariant** — loading is not announced as a live region; it is interstitial noise.

### EmptyState

Glyph, title, body, action. Copy names the one action that unblocks the screen — an
empty screen is an invitation to act.

### ErrorState

Escalation-toned card with title, body, optional retry and optional request ID.

- Copy states what happened and how to fix it. It does not apologise and is never
  vague.

### OfflineNotice

Information-toned. States what still works (saved results, protocol, downloaded
evidence), that entries are queued, and when the last sync happened.

### PendingIntegration

A screen or panel whose contract is not implemented.

- **Invariant** — deliberately plain and dashed, so it can never be mistaken for a
  result, and it names the missing dependency.
- Carries a `Pending integration` chip.

### InlineStatus

Toast-equivalent inline confirmation, always paired with `announce()` so it is never
visual-only.

### Announcer / announce()

One `polite` and one `assertive` live region for the whole app, mounted in the shell.
`announce(message, assertive?)` writes to them.

- Clears then re-sets after 60ms so repeated identical messages are re-announced.

---

## Status vocabulary

### StatusChip

`tone` × glyph × word. **Invariant** — the glyph and the word are both mandatory;
colour is the third channel.

Approved labels: *Within reference context*, *Below reference context*, *Above
reference context*, *Needs attention*, *Insufficient data*, *Confirmation required*,
*Not available*, *Pending integration*, *Externally generated*, *Simulated*.

### MetaBadge

Quiet provenance metadata: source, verification, collection date, abstinence,
laboratory, versions. Mono register, hairline border.

### SimulatedBadge

**Invariant** — renders wherever simulated values appear: list, detail, chart,
comparison, export. Simulated provenance also caps data confidence.

---

## Clinical

### ReferenceStrip

The signature clinical mark: a hairline scale showing where a value falls relative to
its reference interval.

- Quiet `chart-band` fill for the reference region; `chart-band-line` for the limit.
- Solid `chart-mark` tick with a 2px surface ring for the measured value — the
  highest-contrast mark present.
- Hollow `chart-mark-prior` ring for the previous value.
- **Invariant** — no status colour anywhere in the strip. Position plus the
  accompanying `StatusChip` and limit text carry the meaning.
- Scale headroom ×1.45 so a value near a limit is never pinned to an edge.

### ReferenceAttribution

Names the reference set and states what it means — that a lower limit describes the
5th centile of a reference population, not a fertile/infertile boundary.

### MarkerCard

Value, unit, delta chip, reference strip, provenance badges, comparability line.
`compact` for hub lists; `href` makes the whole card a target.

- Carries a visually-hidden sentence giving the label, value, spoken unit and
  reference context, because superscript units do not speak well.

### MissingMarkerCard

Dashed card for a catalogued marker no test measured. **Invariant** — states that
missing data reduces data confidence and never reduces readiness.

---

## Scores

### ReadinessSummary

Score, band, meter, the modifiable-behaviours sentence, rule version, missing-input
count, and a route to the breakdown.

- **Invariant** — "This reflects modifiable behaviours, not measured sperm quality"
  renders on every surface showing the score.

### DomainDetail

Per-domain card: score, meter, window, evidence confidence, weight, signed drivers
with explanations, missing inputs, citations, coach entry.

### ConfidenceCard

Score, band, meter, explanation. `detailed` expands the six weighted factors with
their states.

### RiskCard

Endpoint, state chip, band, uncertainty, model version, generation context, missing
information, confirmation requirement, next action.

- **Invariant** — every card states "A screening risk is not a diagnosis".
- `pending_model` renders as `PendingIntegration` instead, so an unbuilt model never
  occupies a result-shaped card.

---

## Reasoning and evidence

### ReasoningChainView

The signature. Four `Station` components on a rail.

- Stations reveal with a 70ms stagger — the one orchestrated motion moment in the
  product, removed under reduced motion.
- Station 1 result → 2 mechanism (serif) → 3 bounded action (accent card) →
  4 evidence and limits.
- **Invariant** — non-citable evidence IDs are counted and excluded, never silently
  dropped: "1 referenced claim is excluded from recommendations pending verification."
- **Invariant** — renders nothing without its marker. A recommendation cannot appear
  without the result that produced it.

### ReasoningSummaryCard

Entry point from a list: marker, value, reference chip, headline, action category and
title.

### EvidenceCard

Claim, direction, review status, endpoints, study type, population, confidence,
causal flag, last reviewed, clinical review status, limitations, source link.

- **Invariant** — a `research_candidate` renders a dashed escalation border and a
  warning above the claim: "Not usable. Source unverified, so this cannot appear in a
  recommendation." An unverified candidate must never look approved.
- Limitations are a required section, never collapsed away.

### CitationButton

Opens a sheet listing the evidence behind an item, with a count on the trigger.
States plainly when nothing approved is attached and the item is general guidance.

### CoachEntry

The contextual "Ask PreSeed" action. Encodes context ID and label into the query
string so the coach can pin `Discussing: …`.

---

## Protocol

### ProtocolProgress

Day of total, week, version, progress meter, start and retest dates, weekly focus.

### ProtocolAction

Category chip, evidence-status chip, title, description, three-state logging control,
and links to the reasoning chain and citations.

- The three states are `Done | Partly | Skipped`, each with its own glyph, using
  `aria-pressed`.

### ConsistencyCard

Rolling-window adherence over 14 days.

- **Invariant** — a window percentage, never a streak. Copy states that missing a day
  changes the percentage slightly and nothing else.

### AdherenceBand

14 cells, state carried by fill **and** glyph, with a four-item legend including "not
logged".

### ProtocolTimeline

Week-by-week accordion. Current week is expanded by default and marked with a filled
index plus the word "Current".

### AdaptationProposal

Reason, specific changes typed `Add | Adjust | Remove`, the version accepting would
create, and a confirmation sheet.

- **Invariant** — proposed and confirmed. The plan is never rewritten silently, and
  the previous version stays on record.

### RetestPrompt

Due date, relative timing, and the collection conditions to match — abstinence hours
and laboratory taken from the baseline.

---

## Charts

### TrendChart

Single-series line chart per marker.

- One axis. Never two scales — different markers get their own chart.
- 2px line, 4.5px points with a 2px surface ring, ≥14px invisible hit targets.
- Reference region fill plus dashed limit line; dotted ±25% variability lines around
  the baseline.
- Direct labels on endpoints only — never a number on every point.
- `role="img"` with `<title>` and a `<desc>` carrying a full prose summary.
- Points are focusable with per-point `aria-label`; hover and focus both drive the
  tooltip.
- **Invariant** — ships a "View as table" disclosure containing a semantic table with
  a caption.

### ScoreMeter

Segmented track with band divisions at 2px surface gaps.

- `role="meter"` with `aria-valuenow/min/max` and an `aria-valuetext` that reads
  "Insufficient data" when the value is null.
- **Invariant** — not a dial or ring. Those read as game scores.

### DomainBars

Label, numeric value, bar, weight, evidence confidence. A null score renders a
diagonal hatch pattern plus the words "Insufficient data" — pattern, not colour.

---

## Icons

36 glyphs on a 24px grid, 1.5px stroke, round caps, `currentColor`. Decorative by
default; a `label` prop switches to `role="img"` with a `<title>`.
