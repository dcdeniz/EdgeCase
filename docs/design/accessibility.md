# Accessibility

- Target: WCAG 2.2 AA
- Status: Implemented; automated auditing and assistive-technology testing outstanding
- Live test surface: `/design` (reflects the current theme, text scale and contrast)

## What was verified, and how

| Claim | Method | Result |
| --- | --- | --- |
| Every ink and status role clears 4.5:1 on every surface, both themes | Relative-luminance computation over all 8 roles × 4 surfaces × 2 themes | Pass — lowest 4.71 |
| Control borders clear 3:1 | Same, `line-control` against `surface-1` and `surface-3` | Pass — 3.95 / 3.15 dark, 3.57 / 3.19 light |
| Chart palette is colour-vision safe | `validate_palette.js`, all-pairs, both themes | Pass on all six checks |
| Every screen renders without error | `next build` static generation of 35 routes | Pass |
| No lint or type errors | `eslint`, `tsc --noEmit` | Pass |

Outstanding: axe-core or Lighthouse audit; screen-reader passes with VoiceOver/iOS and
TalkBack; testing with disabled users. Conformance is the floor, not the ceiling —
none of the above proves real usability.

## Checklist

### 1 Perceivable

| Requirement | Implementation |
| --- | --- |
| 1.1.1 Non-text content | Icons are `aria-hidden` by default because each sits beside a word; icon-only controls take a `label` prop rendering `role="img"` + `<title>`. Charts are `role="img"` with `<title>` and a prose `<desc>` |
| 1.3.1 Info and relationships | Landmarks (`header`, `nav`, `main`, `footer`); sequential headings; `<dl>` for label/value pairs; `<fieldset>`/`<legend>` for every question group; `<table>` with `<caption>` and `<th scope>` for chart data views |
| 1.3.2 Meaningful sequence | DOM order matches visual order on every screen; no CSS reordering |
| 1.3.4 Orientation | No orientation lock; layouts reflow |
| 1.3.5 Identify input purpose | `autoComplete` on email and password; `inputMode` on measurement and numeric fields |
| 1.4.1 Use of colour | **Every state is a (tone, glyph, word) triple.** The active tab adds a position marker; a null domain score uses a diagonal hatch pattern; adherence states use distinct glyphs; the reference strip carries no status colour at all |
| 1.4.3 Contrast (minimum) | Verified above. Every role ≥ 4.5:1 on every surface |
| 1.4.4 Resize text | All sizes in `rem`; `--ps-text-scale` offers 112/125/150%; layouts wrap rather than clip |
| 1.4.10 Reflow | Single-column mobile-first; wide content scrolls inside its own container; the page body never scrolls horizontally |
| 1.4.11 Non-text contrast | `line-control` (3:1) on every control boundary; focus indicator 3px accent; chart marks and axis meet 3:1 |
| 1.4.12 Text spacing | No fixed heights on text containers; line-height ≥ 1.45 on body roles |
| 1.4.13 Content on hover | No hover-only content. Chart tooltips are also focus-driven and dismissible |

### 2 Operable

| Requirement | Implementation |
| --- | --- |
| 2.1.1 Keyboard | Every control is a native `button`, `a`, `input`, `select` or `textarea`. Chart points are focusable with labels |
| 2.1.2 No keyboard trap | Sheets use `<dialog>.showModal()` — the platform handles containment and Escape. No custom focus traps exist |
| 2.4.1 Bypass blocks | Skip link to `<main id="screen" tabIndex={-1}>` on every shell |
| 2.4.3 Focus order | Matches visual order; sheets receive focus on open and restore it on close |
| 2.4.4 Link purpose | Link text is self-describing; repeated "Open marker" links are disambiguated by their card headings |
| 2.4.6 Headings and labels | Every section has a heading and every input a `<label for>`; sections are `aria-labelledby` their heading |
| 2.4.7 Focus visible | One base-layer treatment, never removed |
| 2.4.11 Focus not obscured | Sticky header and bottom navigation are accounted for by 128px bottom padding and `scroll-margin` behaviour on the main landmark |
| 2.5.3 Label in name | Visible label text is the accessible name on every control |
| 2.5.5 Target size | 44 × 44px minimum on every interactive element; navigation targets are 64px tall |
| 2.5.7 Dragging movements | No drag-only interactions. The sheet grabber is decorative; dismissal is by tap, backdrop or Escape |
| 2.5.8 Target size (minimum) | Exceeded — the AA requirement is 24px |

### 3 Understandable

| Requirement | Implementation |
| --- | --- |
| 3.1.1 Language | `<html lang="en">` |
| 3.2.1 On focus | No context change on focus anywhere |
| 3.2.2 On input | No auto-submit, no auto-advance. Every step commits explicitly |
| 3.2.6 Consistent help | The prototype label sits in the same header position on every screen and routes to the safety centre |
| 3.3.1 Error identification | Errors carry a glyph and text, are associated by `aria-errormessage`/`aria-describedby`, and are announced when dynamic |
| 3.3.2 Labels or instructions | Hints render **above** controls so keyboards and autocomplete popovers cannot cover them |
| 3.3.3 Error suggestion | Error copy states what happened and how to fix it |
| 3.3.4 Error prevention | Consent withdrawal, protocol adaptation and reset all require a confirmation sheet; clinical records are append-only |
| 3.3.7 Redundant entry | Retest entry pre-fills abstinence from the baseline and names the baseline laboratory |
| 3.3.8 Accessible authentication | No cognitive-function test; password managers work via `autoComplete` |

### 4 Robust

| Requirement | Implementation |
| --- | --- |
| 4.1.2 Name, role, value | Native semantics throughout. `aria-pressed` on toggles, `aria-expanded`/`aria-controls` on disclosures, `aria-current` on the active tab, `role="meter"` with `aria-valuetext` on scores, `role="progressbar"` on flow progress |
| 4.1.3 Status messages | One polite and one assertive live region for the whole app. Saves and confirmations announce politely; destructive confirmations announce assertively. Loading states are **not** announced |

## Plain-language medical explanations

Every clinical term is explained where it is used, in the explanation register:

- Marker definitions carry a `meaning` field written for a non-clinician.
- Reference intervals are attributed and explained — "the 5th centile of a reference
  population of recent fathers", not "the normal range".
- The reasoning chain's mechanism station is written as prose an intelligent
  non-specialist can follow, without dropping the biology.
- Approved vocabulary replaces judgement: *within reference context*, *below reference
  context*, *needs attention*, *insufficient data*, *confirmation required*. Never
  *bad*, *abnormal*, *failing* or *infertile*.

## Accessible chart summaries

Every chart provides three routes to the same information:

1. **Visual** — line, marks, reference region, variability band, direct endpoint labels.
2. **Summary** — a `<desc>` giving the marker, the number of measurements, the first
   and last values with dates and spoken units, the reference limit, and the
   variability caveat.
3. **Table** — a "View as table" disclosure containing a semantic table with a caption
   carrying the same summary.

Spoken units are a separate field on every marker definition (`unitSpoken`), because
`×10⁶/mL` does not read aloud usefully.

## Reduced motion

`prefers-reduced-motion: reduce` and the in-app `data-motion="reduced"` both collapse
all durations to 1ms, disable view-transition groups, and rewrite the entry and sheet
keyframes to opacity-only. No content becomes invisible or unreachable.

## Text scaling

Four steps: 100 / 112 / 125 / 150%, applied by multiplying the root font size, so the
browser's own font-size preference compounds correctly. Every size is `rem`. Layouts
use flow, wrapping and `min-height` rather than fixed heights.

At 150%: the five-tab navigation wraps its labels rather than truncating; two-column
choice grids remain two columns with taller cells; the reasoning rail and reference
strips are unaffected because they are proportional.

## High contrast

`prefers-contrast: more`, and the in-app `data-contrast="high"`, promote `ink-3` to
`ink-2`, replace hairlines with `line-control`, and strengthen chart gridlines and
axes. Body text already meets AA without it — the setting exists for the low-chroma
accents that are decorative rather than load-bearing.

## Known gaps

1. No automated audit has been run. `axe-core` in CI is the next step.
2. No screen-reader testing has been performed on iOS or Android.
3. The chart tooltip is a `role="status"` element positioned over the plot; a longer
   series would need a dedicated announcement strategy.
4. Timeline accordions allow one open week at a time, which is a design choice rather
   than an accessibility requirement, and should be validated with users who rely on
   magnification.
