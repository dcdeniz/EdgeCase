# Market inspiration: Strava, Duolingo, Cal AI

- Status: Research input to design
- Last reviewed: 2026-07-25
- Purpose: Decide which consumer-health interaction patterns PreSeed adopts, adapts, or refuses

PreSeed competes for attention against consumer apps, but it carries medical-safety
obligations they do not. This document names the patterns worth stealing, the patterns
that must be refused, and why. It is design research, not a contract. Product claims
remain governed by [the research evidence base](../research/male-fertility-evidence-landscape.md)
and the guardrails in [the master build prompt](../knowledge-base/preseed-master-build-prompt.md).

## The test every borrowed pattern must pass

Consumer engagement patterns are tuned for a user whose data is neutral. PreSeed's data
is not neutral: a result can be frightening, and a protocol can be running during a
failed IVF cycle. So every candidate pattern is checked against one question.

> **The bad-news test.** If this element fires on the day a user receives their worst
> result, is it still respectful?

Streaks fail it. Confidence indicators pass it. This single test decides most of what
follows, and it is why PreSeed can borrow Cal AI's honesty about uncertainty and
Strava's honesty about measurement while declining Duolingo's engine outright.

## Strava — measured performance, presented honestly

Relevant because Strava is the mainstream reference for *longitudinal measured data with
provenance*, aimed at a largely male audience, without being a medical product.

### Adopt

| Pattern | PreSeed translation |
| --- | --- |
| The July 2025 Record redesign collapsed the map view and data view into one screen, removing a toggle athletes had to operate mid-activity | A clinical marker is one card carrying value, unit, reference context, provenance, verification and trend together. Never make a user toggle between "the number" and "what the number means". |
| Continuous, unambiguous feedback while recording — the critique singles this out as the app's strongest interaction, because there is never doubt about whether tracking is happening | Test entry, adherence logging and check-ins always confirm saved state explicitly, with provenance visible. Ambiguity about whether clinical data was recorded is a safety issue, not a polish issue. |
| Activity history is a first-class object, not a settings screen | Trends and the chronological test list sit in primary navigation, because for the vasectomy-reversal track the history *is* the product. |
| Their design-system refresh added a dark theme and a new typeface as one coordinated change | Theme and typography ship as one token layer, not as a later skin. |

### Refuse, and design against

The Pratt design critique (Feb 2026) identifies three failures that map onto PreSeed
risks almost exactly, which makes it more useful than the marketing material.

- **"Gulf of execution": segments surface after the activity, so athletes enter timed
  competitions without knowing.** PreSeed's equivalent trap is collection conditions.
  Abstinence duration, sample completeness and recent fever determine whether two tests
  can be compared at all — and a user only discovers this after entering the second test.
  *Design response: feedforward.* The entry flow states what will affect comparability
  **before** the user enters values, not in a footnote afterwards.
- **False affordances: analytics look available, then reveal a paywall after the user has
  invested effort.** PreSeed's equivalent is unavailable ML. Named screening risks must
  read as *pending integration* before interaction, never after a tap. The critique's
  phrasing is the rule to adopt: constraints should guide behaviour before effort is
  invested, not after.
- **The design assumes competitive athletic motivation, leaving casual users adrift.**
  PreSeed cannot assume an optimiser mindset. The pre-treatment preservation track in
  particular serves someone in crisis with days to act, for whom performance framing is
  actively wrong.

Strava's brand energy — orange described in its own guidelines as bright and active — is
correct for competition and wrong here. PreSeed takes the dark theme and the data density
and deliberately leaves the energy behind.

## Duolingo — habit architecture, with the core mechanic declined

Relevant because it is the most effective daily-habit product in consumer software, and
PreSeed needs daily adherence across roughly 100 days.

### Adopt

- **One clear next action.** The home screen exists to answer "what do I do now". PreSeed's
  Today screen does the same job: today's protocol actions, one primary action, nothing else
  competing.
- **Assess and segment before signup.** A seven-step onboarding establishes proficiency and
  personalises before an account exists; users reach a first completed lesson and visible
  progress inside fifteen minutes, before being asked to create a profile. PreSeed's
  hackathon path mirrors this: track selection and a clearly-labelled simulated result can
  produce real reasoning output before the account gate.
- **Contextual education instead of a manual.** Slide-out panels between steps, tooltips
  during a task, and illustrated empty states — never an upfront tutorial. This is exactly
  the delivery mechanism PreSeed needs for mechanism explanations and evidence limitations.
- **Difficulty adapts quietly in the background.** PreSeed's protocol adaptation is
  analogous, with one mandatory difference: adaptations are *proposed and confirmed*, never
  applied silently, because the plan is a health commitment rather than a lesson queue.
- **A strict two-face type system.** Feather Bold is barred below 30px and reserved for
  short headlines; DIN Next Rounded carries everything longer. The specific faces are wrong
  for PreSeed, but the *discipline* — each face has a declared job and a size floor — is
  worth copying exactly.
- **Milestone artifacts designed to be shared.** Purpose-built share cards drove a
  5–10× increase in organic sharing. PreSeed can celebrate *completing a protocol* or
  *logging a retest*. It must never make a shareable artifact out of a clinical value.

### Refuse

**The streak.** Duolingo's retention engine is loss aversion, not reward anticipation —
users return to avoid losing what they built, with freezes and paid repairs monetising the
lapse. Applied to fertility this is indefensible on three grounds:

1. It converts a health behaviour into a debt, and the brief forbids streak-shaming.
2. A missed day inside a 100-day protocol is clinically meaningless. Sperm maturation runs
   roughly 64–74 days, so punishing a single day encodes a false signal.
3. It fails the bad-news test. A broken-streak screen on the day a user's motility comes
   back below reference is cruel and clinically pointless.

**PreSeed's replacement: a rolling-window consistency band.** Adherence is reported as a
percentage over a trailing window ("82% over the last 14 days") rather than an unbroken
count. A window metric cannot be broken, so there is nothing to shame and no freeze to
sell. Reward attaches to *data quality and evidence unlocked*, never to a measured medical
outcome.

**The mascot.** Duo's effectiveness comes from the baby-schema effect — large eyes,
childlike proportions, protective response. In a male-fertility product, baby cues and
character mascots are the two most damaging clichés available. Refused without exception.

## Cal AI — capture friction, estimate honesty, and the plan reveal

Relevant because it is the closest structural analogue: consumer capture of a biological
measurement, an AI estimate with real uncertainty, and a personalised numeric plan.

### Adopt

- **Onboarding that visibly constructs a plan.** A 28-step quiz builds personal targets
  before any ask. The strongest single component is the weight-loss-speed selector, which
  gives instant feedback on how each pace changes the goal timeline, making an abstract
  target tangible. *PreSeed translation:* the goal-and-timeline step shows the protocol
  length and the retest date moving in real time as the user adjusts their target. This makes
  PreSeed's actual differentiator — a dated protocol ending in a scheduled retest —
  concrete at minute two instead of minute twenty.
- **The plan-ready reveal as a designed moment**, not a redirect to a dashboard.
- **Multi-modal capture behind one surface.** Photo, barcode and nutrition-label modes live
  in one camera with mode switching, which the teardown credits with substantially reducing
  manual-entry friction. *PreSeed translation:* manual entry, lab-report upload and
  simulated demo are three modes of a single entry surface, not three separate flows.
- **Confidence instead of false precision.** The documented best practice is to display a
  confidence level rather than one falsely precise number, and to return structured items
  the user confirms. This independently validates PreSeed's four-output model and its
  provenance/verification fields — the same principle, arrived at from the consumer side.
- **A correction loop the user drives.** Users can give feedback on a scan and edit
  identified ingredients. The teardown's criticism is that correction spans too many steps.
  *PreSeed translation:* confirming extracted lab values is one reviewable list with inline
  editing and a single commit, not a wizard.

### Refuse

- **The central promise itself.** Cal AI's value proposition is photo → number: the depth
  sensor estimates volume, the model returns calories. PreSeed's hard limit is the exact
  inverse — no phone-based measurement, and no confirmation of azoospermia under any
  circumstances, because WHO confirmation requires centrifugation of the sample. The capture
  *pattern* is borrowed; the inference *pattern* is refused, and the interface must say so at
  the moment of capture rather than in terms of service.
- **A paywall immediately after onboarding**, which converts the personalisation investment
  into a toll. PreSeed's equivalent moment must deliver the reasoning output.
- **A trophy room.** A dedicated Milestones tab collecting badges for streaks and logging
  actions gamifies exactly what must not be gamified.

## What this comparison decided

Three of the visual and structural decisions in [the design tokens](tokens.md) and
[information architecture](information-architecture.md) come directly out of this review.

1. **No brand energy colour.** Strava's orange and Duolingo's Duo Green both signal
   "activity, momentum, win". PreSeed's accent is a low-chroma deep teal that reads as
   instrument rather than encouragement, and warmth is reserved exclusively for attention
   and escalation states — so warmth in this product always means *look here*, never
   *well done*.
2. **Two type registers with declared jobs**, borrowing Duolingo's discipline and none of
   its shapes: a technical sans for anything measured, a text serif for anything reasoned or
   cited, and a mono for machine-supplied metadata. The register tells the user what kind of
   claim they are reading before they read it.
3. **Motivation by specificity, not by loss.** Where Duolingo motivates with what you might
   lose and Strava with who you might beat, PreSeed motivates with how precisely it can
   explain *your* result — the reasoning chain is the signature screen and the retention
   mechanic at once.

## Sources

- [Strava launches redesigned Record experience](https://press.strava.com/articles/strava-launches-redesigned-record-experience)
- [Design critique: Strava — IXD@Pratt, February 2026](https://ixd.prattsi.org/2026/02/design-critique-strava/)
- [Strava unveils new chapter of accelerated product development](https://press.strava.com/articles/strava-unveils-new-chapter-of-accelerated-product-development-at-brands)
- [Strava brand guidelines](https://developers.strava.com/guidelines/)
- [How Duolingo's streak mechanic actually works — Apptitude](https://apptitude.io/blog/how-duolingos-streak-mechanic-actually-works/)
- [Duolingo UX design breakdown: 12 patterns — 925 Studios](https://www.925studios.co/blog/duolingo-design-breakdown)
- [Duolingo streaks and daily retention — Deconstructor of Fun](https://duolingo.deconstructoroffun.com/mechanics/streaks)
- [Duolingo brand guidelines: typography](https://design.duolingo.com/identity/typography)
- [Cal AI calorie tracker UI breakdown — Screensdesign](https://screensdesign.com/showcase/cal-ai-calorie-tracker)
- [How to build a photo calorie app like Cal AI](https://codingworkx.com/blog/how-to-build-a-photo-calorie-app-like-calai/)
