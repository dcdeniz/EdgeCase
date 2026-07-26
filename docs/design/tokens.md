# Design tokens

- Status: Implemented in `src/app/globals.css`
- Live reference: `/design`

Semantic names only. **No component may reference a raw hex value.** Tokens are CSS
custom properties prefixed `--ps-`, bridged into Tailwind with `@theme inline` so a
theme, text-scale or contrast change repaints at runtime without a rebuild.

## Colour

Dark is the default when the device expresses no preference. Light applies under
`prefers-color-scheme: light`; the in-app control stamps `data-theme` on the root and
wins in both directions.

### Surfaces

Light is a **warm cream** rather than a cool near-white, per
[ADR 0006](../project/adr/0006-behaviour-score-surface.md). The accent stays
low-chroma teal and warm hues stay reserved for attention and escalation, so
warmth still means *look here*.

| Role | Dark | Light | Use |
| --- | --- | --- | --- |
| `ground` | `#0b1113` | `#f4f1ea` | Page plane |
| `surface-1` | `#141b1d` | `#fffdf8` | Cards |
| `surface-2` | `#1b2427` | `#fbf8f2` | Sheets, raised panels |
| `surface-3` | `#232e31` | `#f1ede5` | Inset areas, control tracks, chip washes |
| `surface-inverse` | `#e6edec` | `#191410` | Inverted fills |
| `scrim` | `rgb(4 8 9 / 0.72)` | `rgb(28 22 14 / 0.4)` | Dialog backdrop |

### Ink

| Role | Dark | Light | Use |
| --- | --- | --- | --- |
| `ink-1` | `#e6edec` | `#101718` | Primary text, measured values |
| `ink-2` | `#a3b1b0` | `#48575a` | Secondary text |
| `ink-3` | `#8a9998` | `#5f6d6f` | Muted labels, axis text |
| `ink-inverse` | `#0b1113` | `#ffffff` | Text on inverse fills |

### Lines

| Role | Dark | Light | Use |
| --- | --- | --- | --- |
| `line-hairline` | `rgb(230 237 236 / 0.10)` | `rgb(43 33 20 / 0.10)` | Decorative separation |
| `line-strong` | `rgb(230 237 236 / 0.18)` | `rgb(43 33 20 / 0.16)` | Emphasised separation, grabber |
| `line-control` | `#6c7b7a` | `#857f74` | **Control borders — meets 3:1** |

`line-control` exists because a 10%-alpha hairline cannot satisfy WCAG 1.4.11 for a
component boundary. Inputs, secondary buttons, choice cards and select controls use
it; decorative dividers use `line-hairline`.

### Status roles

Never the sole carrier of meaning. Each ships with a glyph and a word.

| Role | Dark | Light | Meaning |
| --- | --- | --- | --- |
| `accent` | `#4fc2b5` | `#0a6e66` | Interactive, and measured-and-supported |
| `supported` | `#4cbe83` | `#0f7a46` | Within reference, evidence-backed |
| `attention` | `#e3a05f` | `#9c5a16` | Needs attention, comparability caution |
| `escalation` | `#e77a6c` | `#a6342a` | Clinical escalation, hard limits |
| `information` | `#8fb3ce` | `#3a5c7a` | Neutral context, reference bands |
| `unavailable` | `#8a9998` | `#5f6d6f` | Pending, insufficient, not measured |

Each has a `-quiet` wash at 9–14% alpha for chip and card backgrounds, and `accent`
additionally has `accent-line` (30–38%) and `accent-ink` for text on the accent fill.

There is deliberately **no reward or encouragement colour**. Warmth means *look
here*, never *well done*.

### Verified contrast

Every ink and status role against every surface, both themes — all ≥ 4.5:1:

| | ground | surface-1 | surface-2 | surface-3 |
| --- | --- | --- | --- | --- |
| dark `ink-1` | 16.03 | 14.69 | 13.32 | 11.74 |
| dark `ink-2` | 8.58 | 7.87 | 7.13 | 6.29 |
| dark `ink-3` | 6.42 | 5.89 | 5.34 | 4.71 |
| dark `escalation` | 6.70 | 6.14 | 5.57 | 4.91 |
| light `ink-1` | 16.53 | 18.14 | 17.65 | 16.21 |
| light `ink-2` | 6.87 | 7.54 | 7.33 | 6.74 |
| light `ink-3` | 4.90 | 5.38 | 5.23 | 4.81 |
| light `attention` | 4.92 | 5.40 | 5.26 | 4.83 |

Control borders: dark `line-control` 3.95 on surface-1, 3.15 on surface-3; light
3.92 and 3.40. All ≥ 3:1.

**Light figures above predate the cream change and are now computed estimates,
not measurements.** Scaling by the new ground luminance (0.908 → 0.881) takes the
two tightest pairs — light `ink-3` on ground and light `attention` on ground —
from 4.90 and 4.92 to roughly 4.76 and 4.78. Both still clear 4.5. Re-run the
real validator before any production use.

### Chart series

A three-slot categorical palette, validated under the **all-pairs** rule so it holds
for scatter and small-multiple forms, not only adjacent-pair line and bar charts.

| Slot | Dark | Light | Hue |
| --- | --- | --- | --- |
| `series-1` | `#12a398` | `#008d81` | teal |
| `series-2` | `#c98500` | `#a46e00` | ochre |
| `series-3` | `#7c7ce8` | `#4b4bc4` | indigo |

Validator results, both themes, all pairs:

| Check | Dark | Light |
| --- | --- | --- |
| Lightness band | PASS | PASS |
| Chroma floor | PASS | PASS |
| CVD separation (worst ΔE) | PASS 13.9 | PASS 12.7 |
| Normal-vision floor (worst ΔE) | PASS 20.1 | PASS 18.4 |
| Contrast vs surface | PASS | PASS |

**Three is the cap.** A fourth series folds into "Other", becomes a small multiple, or
gets its own chart. Slots are assigned in fixed order and never cycled; colour follows
the entity, never its rank.

### Chart chrome

| Role | Dark | Light | Use |
| --- | --- | --- | --- |
| `chart-grid` | `rgb(230 237 236 / 0.08)` | `rgb(16 23 24 / 0.07)` | Recessive gridlines |
| `chart-axis` | `rgb(230 237 236 / 0.22)` | `rgb(16 23 24 / 0.20)` | Baseline, variability lines |
| `chart-band` | `rgb(143 179 206 / 0.13)` | `rgb(58 92 122 / 0.10)` | Reference region fill |
| `chart-band-line` | `rgb(143 179 206 / 0.34)` | `rgb(58 92 122 / 0.28)` | Reference limit |
| `chart-mark` | `#e6edec` | `#101718` | Measured value tick — highest contrast on the strip |
| `chart-mark-prior` | `#8a9998` | `#7e8a8a` | Previous value, hollow |

The reference strip carries no status colour at all. Position and words do the work,
which is how the system avoids red/green scoring on its most-viewed clinical mark.

## Typography

Three registers, each with a declared job and a size floor.

| Register | Family | Job | Floor |
| --- | --- | --- | --- |
| Measurement | IBM Plex Sans 400/500/600 | Anything measured, scored, counted, or any UI label | — |
| Explanation | Newsreader 400/500 + italic | Anything reasoned, cited or qualified | Never below `t-body-sm` size |
| Machine metadata | IBM Plex Mono 400/500 | Marker codes, versions, IDs, timestamps, units in badges | Never above `t-caption` size |

### Scale

Sizes are `rem`, so the text-scale preference and the browser's own font size both
apply. `--ps-text-scale` multiplies the root font size; every size follows.

| Token | Size | Line | Tracking | Weight | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| `t-display-1` | 2.75rem | 1.02 | −0.03em | 400 | tabular; hero scores |
| `t-display-2` | 2rem | 1.10 | −0.025em | 400 | tabular; marker values |
| `t-title-1` | 1.375rem | 1.24 | −0.017em | 600 | screen titles |
| `t-title-2` | 1.125rem | 1.30 | −0.012em | 600 | section titles |
| `t-title-3` | 1rem | 1.35 | −0.008em | 600 | card titles |
| `t-body` | 1rem | 1.55 | 0 | 400 | |
| `t-body-sm` | 0.875rem | 1.50 | 0 | 400 | default body in cards |
| `t-caption` | 0.8125rem | 1.45 | 0 | 400 | |
| `t-micro` | 0.6875rem | 1.30 | +0.085em | 600 | uppercase eyebrows and field labels |
| `t-prose` | 1.0625rem | 1.62 | 0 | 400 | serif; max 68ch |
| `t-prose-lead` | 1.25rem | 1.42 | −0.005em | 400 | serif; max 40ch |
| `t-mono` | 0.75rem | 1.40 | +0.01em | 400 | tabular |

Uppercase appears only in `t-micro`, where it is structural — an eyebrow labelling a
region — never as emphasis. Emphasis uses weight.

`font-variant-numeric: tabular-nums` is applied globally to tables, `.ps-num` and
`[data-numeric]`, and is baked into the display and mono roles, so measured values
align in columns and do not shift as they change.

## Spacing

4px base. Tailwind's default spacing scale is retained, so `p-4` is 16px.

| Step | px | Typical use |
| ---: | ---: | --- |
| 1 | 4 | Icon-to-text in a chip |
| 1.5 | 6 | Badge gaps |
| 2 | 8 | Chip rows, tight stacks |
| 2.5 | 10 | Card internal separation |
| 3 | 12 | Between cards in a group |
| 3.5 | 14 | Compact card padding |
| 4 | 16 | Card padding, screen gutters |
| 5 | 20 | Between question groups |
| 6 | 24 | Between sections |
| 8 | 32 | Between major sections |

## Radius

| Token | Value | Use |
| --- | --- | --- |
| `radius-xs` | 0.375rem | Chips, badges, small state pills |
| `radius-sm` | 0.625rem | Buttons, inputs, rows, inner panels |
| `radius-md` | 0.875rem | Cards |
| `radius-lg` | 1.25rem | Chat bubbles |
| `radius-xl` | 1.75rem | Sheet top corners |

Soft rather than sharp, deliberately. Zero-radius broadsheet styling reads as
editorial; this product needs to read as an instrument that is comfortable to hold.

## Borders and focus

| Token | Value |
| --- | --- |
| `border-hairline` | 1px |
| `border-control` | 1px |
| `border-emphasis` | 2px |
| `focus-width` | 3px |
| `focus-offset` | 2px |

Focus is a single treatment applied at the base layer to every interactive element:
a 3px `accent` outline at 2px offset with an `xs` radius. It is never removed.

## Elevation

| Token | Dark | Light |
| --- | --- | --- |
| `elevation-1` | `0 1px 0 rgb(230 237 236 / 0.04)` | `0 1px 2px rgb(16 23 24 / 0.05)` |
| `elevation-2` | `0 8px 24px -12px rgb(0 0 0 / 0.7)`, hairline | `0 8px 24px -12px rgb(16 23 24 / 0.18)`, hairline |
| `elevation-3` | `0 -2px 48px -8px rgb(0 0 0 / 0.8)`, hairline | `0 -2px 48px -8px rgb(16 23 24 / 0.2)`, hairline |

Dark mode leans on the surface step plus a hairline rather than shadow, because
shadow does not read on a dark ground.

## Motion

| Token | Value | Use |
| --- | --- | --- |
| `duration-instant` | 80ms | Press feedback |
| `duration-fast` | 130ms | Colour and state transitions |
| `duration-base` | 190ms | Disclosure, chevron rotation |
| `duration-slow` | 280ms | Screen entry, staggered station reveal |
| `duration-sheet` | 320ms | Bottom sheet travel |
| `ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entering, expanding |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Reversible state |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exiting |

Named keyframes: `ps-fade-in`, `ps-rise-in`, `ps-sheet-in`, `ps-shimmer`, plus four
directional view-transition keyframes.

**Reduced motion** — via `prefers-reduced-motion: reduce` or `data-motion="reduced"` —
collapses every duration to 1ms, disables view-transition groups, and rewrites
`ps-rise-in`/`ps-sheet-in` to opacity-only. State changes stay legible; travel stops.

## Layout

| Token | Value |
| --- | --- |
| `touch-min` | 2.75rem (44px) |
| `shell-max` | 30rem (480px) |
| `header-height` | 3.5rem |
| `nav-height` | 4rem |

Safe-area insets are applied with `pad-safe-top` and `pad-safe-bottom` utilities on
the header, bottom navigation, sticky commit bars and sheet footers.

## Preference attributes

| Attribute | Values | Effect |
| --- | --- | --- |
| `data-theme` | `light` \| `dark` | Overrides the OS colour scheme in both directions |
| `data-text-scale` | `large` \| `larger` \| `largest` | Root font size × 1.125 / 1.25 / 1.5 |
| `data-motion` | `reduced` | Collapses all durations, disables travel |
| `data-contrast` | `high` | `ink-3` → `ink-2`; hairlines → `line-control`; chart grid and axis strengthened |

`prefers-contrast: more` applies the same overrides automatically unless the user has
pinned `data-contrast="standard"`.

## Icons

One 24px grid, 1.5px stroke, round caps and joins, `currentColor` only. 36 glyphs.
Rendered at 12–22px depending on context. Decorative (`aria-hidden`) by default,
because every icon in this product sits beside a word; a `label` prop switches an
icon to `role="img"` with a `<title>` for the rare icon-only control.

Status glyphs are shape-distinct so they survive greyscale: check-in-circle
(supported), triangle (attention), octagon (escalation), circle-i (information),
slashed circle (unavailable), clock (pending), vial (simulated).
