# ADR 0006: A ring, a grid and a composite figure, scoped to behaviour only

- Status: Accepted
- Date: 2026-07-25

## Context

The mobile design system (ADR 0003, `docs/design/README.md`, `docs/design/market-inspiration.md`) rules out three consumer patterns by name:

1. **No composite score.** Merging clinical measurement, modifiable behaviour, model prediction and data confidence into one figure was identified as "the single most damaging pattern available here", and the results architecture keeps the four apart in a fixed order.
2. **No gauge, dial or ring for scores**, because those read as game scores.
3. **No streak.** Duolingo's retention engine was refused on three grounds — it converts a health behaviour into a debt, a missed day inside a 100-day protocol is clinically meaningless against a 64–74 day maturation cycle, and a broken-streak screen fails the bad-news test. The replacement was a rolling-window consistency band.

The product owner asked for a weekly and yearly score, ring visuals, a GitHub-style accountability grid, camera food capture, and wearable sleep and health data, referencing Whoop, Asklepios and `hundred.` as visual targets.

Taken literally that request reverses all three refusals. Taken at its intent — a denser, more familiar consumer surface for the data a man actually generates day to day — most of it is compatible, because the objections above are specific to *what is being scored*, not to the shapes themselves.

## Decision

Introduce a **behaviour score**: a 0–100 composite over four modifiable domains — sleep 30, diet pattern 25, activity 20, protocol adherence 25 — computed in `src/lib/behaviour-score.ts` from logged data, and surfaced weekly and yearly at `/score`.

The three refusals are narrowed rather than dropped:

- **Composite, scoped.** The behaviour score blends modifiable behaviours only. No clinical marker, screening output or confidence term enters it. A semen analysis cannot move it. Clinical outputs keep their separate surfaces under `/results` with their existing treatments. This is the second of the four outputs rendered well, not a merger of all four.
- **Ring, scoped.** `ScoreRing` may render behaviour only, and refuses to render without `BEHAVIOUR_SCORE_CAVEAT` unless the caveat is already in adjacent copy. It is barred from marker values, risks and confidence.
- **Grid, not streak.** The year grid is a *record*. There is no current-streak count, no longest-streak count, no flame and no loss-aversion copy, and the component carries a comment forbidding their addition. The headline number stays the rolling window. A gap renders as a gap.

Two invariants carry over from the readiness engine unchanged: a day with no data scores `null` rather than zero, and missing data lands on coverage rather than on the score.

Camera food capture borrows Cal AI's capture pattern and still refuses its inference pattern: recognition returns structured items with a stated confidence and an explicit list of what it could not determine, nothing reaches the log until the user confirms, and days are scored on dietary *pattern* rather than calories.

Wearable sleep and health data are synthetic, deterministic and labelled simulated. Sleep keeps its claim ceiling — recovery and hormonal context, never a direct semen claim.

The light theme moves from cool near-white to warm cream. Accent stays low-chroma teal and warm hues stay reserved for attention and escalation, so "warmth means look here" survives.

## Consequences

The product now has one composite figure where it previously had none, and the argument for it rests entirely on the exclusion rule. If a future change lets a clinical value, a prediction or a confidence term into `behaviour-score.ts`, the justification in this ADR lapses and the objection in ADR 0003 applies again in full.

`ScoreRing` is a reuse hazard: it is an attractive component and the temptation to point it at a marker value will recur. The file-level comment and this ADR are the only things preventing that.

The grid is one product decision away from becoming a streak. Adding a consecutive-day count to it would reintroduce precisely the mechanic the design research rejected, on a screen that a man may open on the day a result comes back below reference.

Contrast was re-derived rather than re-measured: cream ground drops from L 0.908 to 0.881, scaling the two tightest verified pairs — light `ink-3` on ground (4.90) and light `attention` on ground (4.92) — to roughly 4.76 and 4.78. Both still clear 4.5, but these are computed estimates and warrant re-running the real validator before any production use.

Default theme is now light rather than system, so the cream surface is what a visitor sees first. The display settings screen still changes it in both directions.
