# hundred. — visual reference study

- Status: Design research input
- Captured: 2026-07-25, from two product screenshots
- Purpose: Record observed values so components reference a study rather than a guess

**These are eyedropped estimates from compressed screenshots, not published brand
tokens.** Treat them as a target to interpret, not a spec to match exactly.

## Source frames

1. **Marketing + app set** (five phones) — onboarding, welcome, protocol checklist,
   results grid, supplements. Mixed dark and cream.
2. **Biomarker detail** (Iron) — the densest frame, and the one that defines the
   parameter-row pattern.

## Palette

### Dark surfaces (dominant)

| Role | Observed | Notes |
| --- | --- | --- |
| Page ground | `#0a0b0a` | Near-black, very slight green cast |
| Card | `#1f2221` | Raised, low chroma |
| Card nested | `#2e3231` | A second step up, used for the result/range pair |
| Pill (neutral) | `#3a3e3d` | |

### Cream surface (results screen, marketing)

| Role | Observed | Notes |
| --- | --- | --- |
| Ground | `#f7f4ee` | Warm cream, close to our new `ground` |
| Card | `#ffffff` | |

### Ink

| Role | Observed |
| --- | --- |
| Primary | `#ffffff` (dark) / `#141414` (cream) |
| Secondary | `#b4b4b4` |
| Eyebrow / tertiary | `#9a9a9a` |

### Status

| Role | Observed | Used for |
| --- | --- | --- |
| Out of range | `#e8836a` coral — value text and pill fill | Biomarker outside range |
| In range | `#5cb85c` green | Grid cells, checkmarks |
| Optimal | `#4a7fe0` blue | Grid cells |

## Typography

| Element | Observed | Notes |
| --- | --- | --- |
| Eyebrow | ~14px, uppercase, +0.06em, secondary grey | `NUTRIENT LEVELS` |
| Parameter title | ~40px, weight 700, tight leading | `Iron` — its own line, nothing beside it |
| Body | ~17px, ~1.5 leading, secondary grey | 2–3 lines maximum |
| Value | ~40px, weight 600, tabular | `181` |
| Unit | ~17px, secondary, directly beneath the value | `mcg/L` |
| Column heading | ~19px, weight 600, primary | `Your result` / `In Range` |
| Editorial accent | Serif italic, mixed inline with sans | `deserves`, `discovered` |

Two families: a geometric sans for everything measured, a serif italic used
sparingly for one or two words in a headline. Our three-register system already
covers this and is stricter; no change needed.

## Structure — the pattern worth taking

The Iron frame is the useful one:

1. Eyebrow, small and grey.
2. **Parameter name alone on its own line, large and bold.** Nothing shares the
   line with it. This is the single most legible thing in the reference and the
   change to make.
3. Two or three lines of plain description.
4. A nested card holding `Your result` beside `In Range`, each with a big value,
   a unit under it, and a status pill under that.
5. `Results over time` chart in its own card below.

Density comes from generous vertical rhythm and very few words, not from
tightening. Cards nest one level. Corner radius is large — roughly 20px outer,
16px inner.

## What we adopt

- Parameter name alone on its own line, large and bold.
- Value / reference-range pair side by side, unit beneath the value.
- Status as a filled pill under the value.
- Nested card for the result pair; large radii.
- Ruthless text economy. No explanatory paragraph on an app screen.

## What we do not adopt, and why

- **Red / amber / green status coding.** The design rationale bars it outright:
  the reference strip is neutral graphite, and position plus words carry the
  meaning. A coral "out of range" pill on a semen parameter also converts a
  distribution centile into a pass/fail, which the research base forbids —
  *"never turn WHO reference distributions into a fertile/infertile diagnosis"*.
  We keep `attention` for out-of-reference, which is warm but means *look here*.
- **"Out of Range" as wording.** Our approved vocabulary is *below reference
  context* / *within reference context*. "Out of range" reads as a verdict.
- **The blue/green/red biomarker grid.** Same objection. Our year grid is
  single-hue by design.
- **Dark as the default.** We shipped warm cream; the reference uses both.
