# Interaction specification

- Status: Implemented
- Last updated: 2026-07-25

## Navigation

| Interaction | Behaviour |
| --- | --- |
| Tab change | Immediate route change. `<main>` is keyed on pathname and replays `ps-rise-in` (280ms, `ease-out`, 8px travel). Scroll resets to top |
| Forward within a flow | Sticky commit bar advances the step; the progress rail fills and the numeric counter updates together |
| Back | Header chevron. String `back` navigates to a known parent; `back={true}` uses router history for screens reachable from several places (the coach) |
| Deep link | Every screen renders standalone. Screens needing data they lack render their empty state rather than redirecting |

Directional view transitions are specified and their CSS is in place —
`ps-slide-to-start` / `ps-slide-from-end` for forward, mirrored for backward, keyed on
`:active-view-transition-type()`. They activate when the router adopts the View
Transitions API; the entry animation is the current fallback. Both are removed under
reduced motion.

## Touch and pointer

| Interaction | Behaviour |
| --- | --- |
| Minimum target | 44 × 44px everywhere, enforced by `min-h-(--ps-touch-min)` on every control |
| Press | Background shifts on `:active` at `duration-instant` |
| Hover | Only strengthens an existing affordance. No hover-only information anywhere |
| Chart point | Hit target 14px radius against a 4.5px mark. Hover and focus both open the tooltip; `mouseleave` on the SVG closes it |
| Sheet dismissal | Backdrop tap, Escape, or the close control. Drag-to-dismiss is not implemented; the grabber is an affordance for the tap target above it |

## State changes

### Logging a protocol action

1. Tap `Done`, `Partly` or `Skipped`.
2. The pressed state applies immediately — `aria-pressed="true"`, accent fill.
3. `announce("<title> marked done")` writes to the polite live region.
4. The consistency band and window percentage recompute.

No confirmation, no undo prompt, no penalty. Re-tapping another state overwrites.
Logging is idempotent per item per day, matching `putAdherenceEvent`.

### Saving a clinical result

1. Review step shows the assembled record with provenance and storage rules.
2. `Save result` commits.
3. `announce("Result saved to your clinical profile")`.
4. Route to `/trends` if this is a second semen analysis, `/results` otherwise —
   the user lands where the new information is most meaningful.

The record ID is derived from panel and collection date, so re-rendering the review
step cannot mint duplicate records.

### Accepting a protocol adaptation

1. Proposal renders with reason, typed changes, and the version accepting would create.
2. `Review and accept` opens a confirmation sheet listing the changes again.
3. Confirming increments the version and clears the proposal.
4. `announce("Protocol updated to a new version")`.

`Keep current plan` dismisses without change. **The plan never changes without this
sequence.**

### Withdrawing consent / resetting the prototype

Both require a `ConfirmSheet`, both use the escalation tone, and both announce
assertively because they change what the app can do.

## Progressive disclosure

| Pattern | Behaviour |
| --- | --- |
| Disclosure | `aria-expanded` on the button, `aria-controls` to a region with `hidden`. Chevron rotates 180° at `duration-base`. Content is in the DOM but hidden — search finds it, screen readers skip it when collapsed |
| Reasoning chain | "Why this applies to me" opens by default; mechanism is always visible; limitations and study detail are collapsed |
| Timeline week | Accordion, one open at a time. The current week opens by default; tapping the open week closes it |
| Conditional questions | The training-recovery question appears only when activity is "more than 5" — it is inserted, not disabled |

## Feedback

| Signal | Channel |
| --- | --- |
| Saved | `InlineStatus` or route change **plus** `announce()` polite |
| Destructive confirmed | `announce()` assertive |
| Validation error | Inline under the field with glyph and text, after commit only |
| Loading | Skeleton matching content shape, visually-hidden label, **not** announced |
| Nothing to show | Empty state naming the unblocking action |
| Cannot be built yet | `PendingIntegration` naming the missing dependency |

Toasts are not used. A floating message that disappears is the wrong medium for
anything in this product; confirmations are inline and permanent, or they are route
changes.

## Form behaviour

- **Hints above controls.** Autocomplete popovers and mobile keyboards cover the area
  below an input.
- **Errors after commit.** `:user-invalid` means a field is not marked wrong while the
  user is still typing it.
- **Units rendered, not typed.** The unit block sits inside the control boundary and
  is `aria-hidden`; the label and hint carry meaning for assistive technology.
- **`inputMode="decimal"`** on measurement fields, `type="date"` for dates,
  `autoComplete` on identity fields.
- **Exclusive options.** Selecting "None" or "Prefer not to say" clears other
  selections in the same group.
- **Disabled continue.** A gate that cannot be passed is `disabled` rather than
  showing an error on tap — except for pending-integration actions, which use
  `aria-disabled` so they stay reachable and can explain themselves.

## Safety interactions

| Rule | Implementation |
| --- | --- |
| A clinical gate cannot be dismissed | `SafetyAlert` has no dismiss control and renders above any score on the same screen |
| A serious flag cannot be averaged away | Gates are returned separately from the score and are structurally not point deductions |
| Simulated data is always labelled | `SimulatedBadge` on every surface; simulated provenance caps data confidence |
| A zero is never a finding | Entering `0` concentration renders the mandatory message during entry, again at review, and labels the record permanently |
| The azoospermia notice cannot be scrolled past on the reversal track | It is the first element on the screen, above the fold, non-dismissible |
| Nothing invents a backend | Every unimplemented capability renders `PendingIntegration` naming its dependency |

## Motion inventory

| Moment | Animation | Duration | Easing |
| --- | --- | --- | --- |
| Screen entry | `ps-rise-in`, 8px + opacity | 280ms | `ease-out` |
| Reasoning stations | `ps-rise-in`, 70ms stagger per station | 280ms | `ease-out` |
| Sheet entry | `ps-sheet-in`, translateY 100% | 320ms | `ease-out` |
| Backdrop | `ps-fade-in` | 190ms | `ease-out` |
| Disclosure chevron | `rotate(180deg)` | 190ms | default |
| Control state | `background-color`, `border-color` | 130ms | default |
| Skeleton | `ps-shimmer`, infinite | 1.6s | `ease-in-out` |

The staggered reasoning reveal is the only orchestrated sequence in the product. It
earns its place because the chain is an argument and the stagger reflects its order.
Everything else is state feedback.

**Reduced motion** collapses every duration to 1ms, disables view-transition groups,
and rewrites `ps-rise-in` and `ps-sheet-in` to opacity-only. Nothing becomes
invisible or unreachable; only travel is removed.

## Offline

Specified, not implemented. The intended behaviour:

- Saved results, the active protocol and previously opened evidence remain readable.
- New entries queue locally and sync when the connection returns.
- `OfflineNotice` states what still works and the last sync time, rather than
  presenting a generic failure.
- Clinical writes are idempotent by key, so a replayed queue cannot duplicate a
  record.

## Keyboard support

The application is a mobile web app and is fully keyboard operable.

| Key | Behaviour |
| --- | --- |
| Tab / Shift-Tab | Moves through a DOM order that matches the visual order |
| Enter / Space | Activates buttons and choice cards |
| Escape | Closes any sheet or dialog |
| Arrow keys | Move within radio groups natively |

Focus is a single 3px accent outline at 2px offset, applied at the base layer and
never removed. Sheets take focus on open via `showModal()` and restore it to the
trigger on close.
