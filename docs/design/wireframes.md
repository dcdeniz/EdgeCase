# Low-fidelity wireframes

- Status: Implemented at high fidelity; these record the underlying layout intent
- Viewport: 390 × 844 reference

Frame width below is 44 characters ≈ 390pt. `[ ]` is a control, `( )` a chip,
`▓` a filled bar, `░` an empty track, `·····` a hairline.

## Welcome

The hero is the reasoning chain performed, not described. No stat tile, no gradient.

```text
┌──────────────────────────────────────────┐
│ PreSeed                     (Prototype)  │
├──────────────────────────────────────────┤
│ MALE FERTILITY INTELLIGENCE              │
│                                          │
│ Most fertility apps hand you advice.     │  ← serif lead, 40ch
│ PreSeed hands you the reasoning          │
│ behind it.                               │
│                                          │
│ ① YOUR RESULT                            │
│ │ ┌──────────────────────────────────┐   │
│ │ │ Progressive motility        27 % │   │
│ │ │ ░░░░░▌░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   │  ← reference strip
│ │ │ (Below reference context)        │   │
│ │ │ (Simulated)                      │   │
│ │ └──────────────────────────────────┘   │
│ ② MECHANISM                              │
│ │ Forward movement is powered by         │  ← serif, 68ch
│ │ mitochondria in the sperm midpiece…    │
│ ③ BOUNDED ACTION                         │
│ │ ┌──────────────────────────────────┐   │
│ │ │ Four fish meals a week, nuts…    │   │  ← accent-quiet card
│ │ └──────────────────────────────────┘   │
│ ④ EVIDENCE AND LIMITS                    │
│   ┌──────────────────────────────────┐   │
│   │ Mediterranean-diet SR and MA     │   │
│   │ (Moderate confidence)(Observ.)   │   │
│   └──────────────────────────────────┘   │
│                                          │
│ Four separate answers, never one score   │
│ …                                        │
│ What PreSeed will not do                 │
│ ⊘ Confirm azoospermia…                   │
├──────────────────────────────────────────┤
│ [ Screen map ]      [ Get started    → ] │  ← sticky
└──────────────────────────────────────────┘
```

## Linear flow shell (signup, onboarding, test entry, check-in)

```text
┌──────────────────────────────────────────┐
│ ←   LIFESTYLE                (Prototype) │
│     ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░       7/10   │  ← bar + numeric, both
├──────────────────────────────────────────┤
│ The behaviours with real evidence        │  ← h1
│ behind them                              │
│ Only questions that change your plan.    │
│                                          │
│ Typical sleep on a work night            │  ← legend
│ Sleep carries the largest single weight… │  ← why we ask
│ ┌────────────────┐ ┌───────────────────┐ │
│ │ ○ Under 6 hrs  │ │ ○ 6 to 7 hours    │ │  ← 44px min
│ └────────────────┘ └───────────────────┘ │
│ ┌────────────────┐ ┌───────────────────┐ │
│ │ ● 7 to 8 hours │ │ ○ Prefer not to   │ │
│ └────────────────┘ └───────────────────┘ │
│                                          │
│ Nicotine                                 │
│ …                                        │
├──────────────────────────────────────────┤
│ [ Continue                            → ]│  ← sticky commit
└──────────────────────────────────────────┘
```

## Tabbed screen shell

```text
┌──────────────────────────────────────────┐
│ ←   EYEBROW                  (Prototype) │  ← sticky, blurred
│     Screen title                         │
├──────────────────────────────────────────┤
│                                          │
│  content, 16px gutters, max 30rem        │
│                                          │
│                                          │
├──────────────────────────────────────────┤
│  ☀     ▤      ▦      ▤      ☻           │  ← 5 destinations
│ Today Results Protocol Evid. Account     │
│         ▔▔▔                              │  ← position marker
└──────────────────────────────────────────┘
```

## Today

Gates first, then the plan, then behaviour. Nothing competes with today's actions.

```text
┌──────────────────────────────────────────┐
│ 25 Jul 2026 · Today                      │
├──────────────────────────────────────────┤
│ ┃⚠ Testosterone or anabolic steroid use  │  ← gate, above everything
│ ┃  recorded                              │
│ ┃  Discuss with a clinician before…      │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ PROTOCOL                             │ │
│ │ 97 of 100              week 14 · v1  │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ │ │
│ │ Started 20 Apr    Retest due 27 Jul  │ │
│ │ ····································· │ │
│ │ THIS WEEK  Closing week. Collection   │ │
│ │ conditions matter more than anything… │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ ▤ Closing analysis due in 2 days     │ │  ← accent card
│ │   Aim for 62h abstinence · same lab  │ │
│ │   [ Enter the result ]               │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ DAY 97 · WEEK 14        Full plan →      │
│ Today's actions                          │
│ ┌──────────────────────────────────────┐ │
│ │ (Sleep) (Evidence-backed)            │ │
│ │ Keep a 7.5-hour sleep window         │ │
│ │ Same lights-out and wake time…       │ │
│ │ [✓ Done] [◐ Partly] [⊖ Skipped]      │ │  ← 44px each
│ │ ····································· │ │
│ │ [ Why this is in my plan ] [ Cites 1]│ │
│ └──────────────────────────────────────┘ │
│ …                                        │
│ ┌──────────────────────────────────────┐ │
│ │ CONSISTENCY · LAST 14 DAYS           │ │
│ │ 82% of logged actions                │ │
│ │ ✓✓◐✓⊖✓✓✓·◐✓✓⊖✓                       │ │  ← window, not streak
│ │ ✓ Completed ◐ Partly ⊖ Skipped · Not │ │
│ └──────────────────────────────────────┘ │
│ Readiness │ 64/100 …                     │
└──────────────────────────────────────────┘
```

## Results hub

Four outputs, numbered, never merged.

```text
┌──────────────────────────────────────────┐
│ Four separate outputs · Results          │
├──────────────────────────────────────────┤
│ 1 · MEASURED            All markers →    │
│ Clinical profile                         │
│ 18 Apr 2026 · 98 days ago  (Simulated)   │
│ ┌──────────────────────────────────────┐ │
│ │ SPERM CONCENTRATION      ↑ +4.4 higher│ │
│ │ 14.2  ×10⁶/mL                        │ │
│ │ ░░░░░░░▌░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        │ │
│ │ (Below reference context) Limit 16.0 │ │
│ │ Open marker →                        │ │
│ └──────────────────────────────────────┘ │
│ …                                        │
│ [ See all 6 measured markers        → ]  │
│                                          │
│ WHY YOUR PLAN SAYS WHAT IT SAYS          │
│ Parameter reasoning                      │
│ ┌──────────────────────────────────────┐ │
│ │ PROGRESSIVE MOTILITY                 │ │
│ │ 27 %          (Below reference)      │ │
│ │ Progressive motility is the largest  │ │
│ │ gap to its reference interval        │ │
│ │ ···································· │ │
│ │ (Nutrition) Shift dietary pattern… → │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ 2 · BEHAVIOUR                            │
│ Readiness score                          │
│ ┌──────────────────────────────────────┐ │
│ │ READINESS SCORE            64 /100   │ │
│ │ Mostly supportive                    │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓│▓▓▓▓▓│░░░░│░░░░│░░░░  │ │  ← segmented, not a dial
│ │ ┌──────────────────────────────────┐ │ │
│ │ │ This reflects modifiable          │ │ │
│ │ │ behaviours, not measured sperm    │ │ │
│ │ │ quality.                          │ │ │
│ │ └──────────────────────────────────┘ │ │
│ │ (prototype-rules-0.4.0) (3 missing)  │ │
│ │ [ See what moved it              → ] │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ 3 · SCREENING              All four →    │
│ Named screening risks                    │
│ ┌──────────────────────────────────────┐ │
│ │ Azoospermia screening  (Not avail.)  │ │
│ │ Below-ref. progressive (Externally…) │ │
│ │ Below-ref. concentration (Pending)   │ │
│ │ Endocrine pattern    (Insufficient)  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ 4 · TRUST                                │
│ Data confidence  38/100  Low confidence  │
└──────────────────────────────────────────┘
```

## Reasoning chain — the signature screen

```text
┌──────────────────────────────────────────┐
│ ←  PARAMETER REASONING                   │
│    Why this applies                      │
├──────────────────────────────────────────┤
│ Progressive motility is the largest gap   │
│ to its reference interval                │
│                                          │
│ ⓵ YOUR RESULT                            │
│ │ ┌──────────────────────────────────┐   │
│ │ │ Progressive motility       27 %  │   │
│ │ │ ░░░░▌░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓         │   │
│ │ │ (Simulated) (98 days ago)        │   │
│ │ └──────────────────────────────────┘   │
│ │ ▾ Why this applies to me               │  ← open by default
│ │   Progressive motility is the          │
│ │   measurement furthest below its…      │
│ │   ┌────────────────────────────────┐   │
│ │   │ Because oxidative stress is a   │   │
│ │   │ shared upstream driver…         │   │  ← integrative framing
│ │   └────────────────────────────────┘   │
│ │                                        │
│ ⓶ MECHANISM                              │
│ │ Forward movement is powered by         │  ← serif, 68ch
│ │ mitochondria packed into the sperm     │
│ │ midpiece. Those mitochondria are       │
│ │ unusually vulnerable to reactive       │
│ │ oxygen species…                        │
│ │                                        │
│ ⓷ BOUNDED ACTION                         │
│ │ ┌──────────────────────────────────┐   │
│ │ │ Shift dietary pattern  (Nutrition)│  │
│ │ │ Four fish meals a week, a daily   │   │
│ │ │ portion of nuts, olive oil…       │   │
│ │ │ ⓘ Three specific substitutions,   │   │
│ │ │   assessed at your next check-in. │   │
│ │ └──────────────────────────────────┘   │
│ │                                        │
│ ⓸ EVIDENCE AND LIMITS                    │
│   ┌──────────────────────────────────┐   │
│   │ Backed by 3 internally reviewed   │   │
│   │ sources. Clinical review is not   │   │
│   │ complete for any claim.           │   │
│   │ ┌──────────────────────────────┐  │   │
│   │ │ Mediterranean-diet SR & MA  →│  │   │
│   │ │ (Moderate) (Observational)   │  │   │
│   │ └──────────────────────────────┘  │   │
│   │ 1 referenced claim is excluded…   │   │
│   │ ▸ Known limitations            3  │   │
│   │ [ Ask PreSeed about this ]        │   │
│   └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

## Clinical test entry — step 2, collection conditions

Feedforward before the fields, not a footnote after them.

```text
┌──────────────────────────────────────────┐
│ ←  COLLECTION CONDITIONS       2/3       │
│    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░                 │
├──────────────────────────────────────────┤
│ How was the sample collected?            │
│ These conditions decide whether this     │
│ result can be compared with your next.   │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ⓘ Why this decides everything later  │ │  ← information card
│ │   Abstinence duration alone changes  │ │
│ │   volume and concentration…          │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Collection date                          │
│ ┌──────────────────────────────────────┐ │
│ │ 2026-07-24                           │ │
│ └──────────────────────────────────────┘ │
│ Abstinence before the sample             │
│ Your baseline was 62 hours. Matching it  │  ← hint ABOVE input
│ keeps the two comparable.                │
│ ┌───────────────────────────┬──────────┐ │
│ │ 60                        │  hours   │ │  ← unit rendered
│ └───────────────────────────┴──────────┘ │
│ Was the sample complete?                 │
│ Losing part of the sample makes volume…  │
│ ┌──────────────────────────────────────┐ │
│ │ Yes, the whole sample was collected ⌄│ │
│ └──────────────────────────────────────┘ │
├──────────────────────────────────────────┤
│ [ Back ]          [ Continue          → ]│
└──────────────────────────────────────────┘
```

## Trends

The refusal comes before the numbers.

```text
┌──────────────────────────────────────────┐
│ ←  BASELINE AND LATEST · Trends          │
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │
│ │ PreSeed cannot tell you what caused  │ │  ← serif, information tone
│ │ a change. Sample-to-sample variation │ │
│ │ within the same man is substantial,  │ │
│ │ two samples are not an experiment…   │ │
│ └──────────────────────────────────────┘ │
│ (Collection conditions comparable)       │
│                                          │
│ THE INTERVAL                             │
│ What was running between the two         │
│ ┌──────────────────────────────────────┐ │
│ │ Baseline           18 Apr 2026       │ │
│ │ Latest             24 Jul 2026       │ │
│ │ Protocol active    v1 · 100 days     │ │
│ │ Adherence 90 days  79%               │ │
│ │ Provenance         Simulated → Simul.│ │
│ └──────────────────────────────────────┘ │
│                                          │
│ MEASURED CHANGE                          │
│ ┌──────────────────────────────────────┐ │
│ │ SPERM CONCENTRATION                  │ │
│ │ 14.2 → 18.6  ×10⁶/mL     +4.4  +31%  │ │
│ │ 4.4 higher. Larger than the roughly  │ │
│ │ 25% variation expected between…      │ │
│ │                                      │ │
│ │  20┤            ╭─●  18.6            │ │
│ │    ┊·····╌╌╌╌╌╌╌╌╌╌╌╌ +25% band      │ │
│ │  16├────────────────── limit ────────│ │
│ │    ┊╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ −25% band      │ │
│ │  14┤ ●14.2 ╯                         │ │
│ │    └──────────────────────────       │ │
│ │     18 Apr           24 Jul          │ │
│ │ Shaded region is at or above the…    │ │
│ │ ▸ View as table                      │ │  ← table alternative
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

## Preservation priority

No protocol, no score, no testing claim. Urgency and navigation only.

```text
┌──────────────────────────────────────────┐
│ FERTILITY PRESERVATION · Priority        │
├──────────────────────────────────────────┤
│ ┃⚠ Preservation comes before anything    │
│ ┃  else in this app                      │
│ ┃  If treatment has not started, banking │
│ ┃  protects options that lifestyle       │
│ ┃  change cannot recover afterwards…     │
│                                          │
│ When does treatment start?               │
│ ┌──────────────────────────────────────┐ │
│ │ 2026-08-10                           │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ TIME BEFORE TREATMENT                │ │
│ │ 16 days                              │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ DO THESE NOW              1 of 4         │
│ Immediate actions                        │
│ ┌──────────────────────────────────────┐ │
│ │ ☑ Ask for a fertility specialist     │ │
│ │   referral today   (Highest impact)  │ │
│ │   Meeting a fertility specialist is  │ │
│ │   the single strongest predictor…    │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ ☐ Ask about sperm banking before     │ │
│ │   treatment starts (Time-critical)   │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ TAKE THESE WITH YOU                      │
│ Questions for your oncology team         │
│ 1 Is my planned treatment likely to…     │
│ 2 Can I bank sperm before treatment…     │
│ [ Share this list ]                      │
│                                          │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│ │ ⏱ Directory of licensed storage      │ │  ← dashed = pending
│ │   services      (Pending integration)│ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
└──────────────────────────────────────────┘
```

## Bottom sheet

```text
┌──────────────────────────────────────────┐
│                                          │
│        (scrim, ::backdrop)               │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │              ▬▬▬▬                    │ │  ← grabber
│ │ EVIDENCE                        [×]  │ │  ← sticky header
│ │ What this is based on                │ │
│ ├──────────────────────────────────────┤ │
│ │ ┌──────────────────────────────────┐ │ │
│ │ │ FAVOURABLE ASSOCIATION (Internal)│ │ │
│ │ │ Mediterranean-style dietary      │ │ │
│ │ │ patterns show favourable…        │ │ │
│ │ │ Open evidence card             → │ │ │
│ │ └──────────────────────────────────┘ │ │
│ ├──────────────────────────────────────┤ │
│ │ [ Close ]                            │ │  ← sticky footer
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```
