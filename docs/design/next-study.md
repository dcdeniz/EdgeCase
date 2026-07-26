# /next — density audit and redesign study

- Status: Design study, implemented as the review route `/next`
- Date: 2026-07-26
- Inspiration set: hundred. (100Health), Substack, Strava
- Builds on: `hundred-reference.md`, `market-inspiration.md`, `tokens.md`

## The audit in one sentence

The system's principles are right and the screens disobey them: Today declares
"one question — what do I do now" in its own source comment, then renders
**eighteen distinct surfaces** to answer it.

## Where the bulk comes from (measured on `/today`)

| Symptom | Count on one screen | Effect |
| --- | --- | --- |
| Stacked `Card` sections | 14+ (hero, profile board, sperm age, 4 tiles, progress, retest, actions ×n, consistency, check-in, questionnaire readiness, latest result) | Every card is a box with a border, a heading, chips and a link — nothing recedes, so nothing leads |
| Repeated caveats | 5 renderings of the same two sentences (score caveat ×2, simulated ×3+) | Safety copy stops being read — repetition *weakens* the guardrail |
| Machine metadata on the consumer surface | rule versions, `v1`, `weight 0.3`, model versions, `via Whoop` chips per tile | This is provenance for auditors, not for a Tuesday morning |
| Two scores called readiness | `ReadinessHero` (behaviour) + "Questionnaire readiness" | The screen's one number has a rival on the same screen |
| Uppercase eyebrow on every block | ~15 per screen | An emphasis device used everywhere emphasises nothing |
| Link styles | 4 different "open this" treatments | Choice fatigue on every card foot |

The palette, tokens, a11y and safety architecture are **not** the problem — they
are the best part of the codebase and the redesign keeps them untouched.

## Studies

### 1 · hundred. — one number owns the screen

Their results frame leads with a single huge numeral on warm cream; parameters
are quiet rows beneath, and chrome is nearly absent (see `hundred-reference.md`).
**Take:** the Seed Score becomes a typographic hero — no ring, no card, no box.
Cream ground (`data-theme="light"`, already contrast-verified) instead of the
default near-black: clinical calm, not dashboard.

### 2 · Substack — the editorial register does the explaining

Substack's surface is a masthead, a serif headline and a reading measure; UI
chrome is hairlines. PreSeed already ships Newsreader but confines it to 17px
body prose. **Take:** serif moves to display duty (score numeral, section
leads); explanations become one italic serif line instead of a boxed
info-strip; section headers become small mono folios (like a journal's running
head), used **three times**, not fifteen.

### 3 · Strava — data moments are bold, few, and honest

Strava's record screen collapsed map+data into one view; stats are a single
confident row, and history is first-class (per `market-inspiration.md`, which
also defines what we refuse: streaks, segments-after-the-fact). **Take:** the
four wearable tiles become one stat band — four mono numerals, one shared
provenance caption. The 14-day consistency card becomes a micro bar-strip under
the hero. Actions become tap-to-log rows with detail one tap away
(feedforward preserved in the expanded state).

## 4 · PR #20 — the splash sets the palette

The landing splash (PR #20, `landing-splash`) is the strongest frame in the
product: cream `#f4f1ea`, teal `#4fc2b5` and soft gold `#c9a15f` streaking a
deep warm ground, written as "a doorway into the cream app". Two consequences
adopted here:

1. **The app the doorway promises must be cream.** The splash's streaks are the
   colour of the surface behind it; `/next` runs on the verified light theme so
   the promise is kept the moment you walk through.
2. **The gold is promoted to a token.** `--ps-gold` / `--ps-gold-ink` /
   `--ps-gold-quiet` now exist in all three theme blocks and the Tailwind
   bridge (`text-gold`, `bg-gold`, …). Rule: identity punctuation only — the
   masthead full stop, the folio dash, today's bar in the strip, the active-tab
   tick. Never a status, never the sole carrier of meaning, never on a
   clinical value. On cream, small gold text must use `gold-ink` (`#7d5c1e`,
   AA); raw `#c9a15f` is decorative-scale only.

## The /next contract

1. **One screen, one question.** Score → three actions → body data → latest
   result. Everything else is a door.
2. **Every caveat once.** Simulated: once in the masthead. Behaviour-not-biology:
   once under the score. Full disclaimer: once in the footer.
3. **Machine metadata off the surface.** Versions, weights, rule ids live behind
   "How it's scored" and detail screens. Provenance survives as one caption.
4. **Safety unmoved.** Gates still outrank the score and cannot be dismissed;
   the adaptation proposal is still consent-first; no streaks appear.
5. **Tokens untouched.** Same palette, spacing, motion and type files — the
   redesign is scale, placement and deletion, not a new theme.

## What moved where (nothing is deleted from the product)

| Was on Today | Now |
| --- | --- |
| Questionnaire readiness card | behind "How it's scored" (`/score`) |
| SemenProfile board + sperm age | `/results` (teaser keeps date + 2 headline markers) |
| Contributors list card | one-line door with count |
| Consistency card | micro-strip + one line under the hero |
| Weekly actions list | one summary row → `/protocol` |
| Metric tile chips/captions ×4 | one shared caption line |
