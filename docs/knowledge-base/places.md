# PreSeed — Master Build Prompt

One assumption made below: the MVP is general-purpose (any man tracking fertility), with the underserved segments (vasectomy reversal, fertility preservation before cancer treatment) handled as onboarding tracks rather than separate products. Flag if you want it scoped differently.

---

## What this is

A personalised, adaptive fertility-improvement app for men. A user logs a sperm test result (mocked for the hackathon, no physical device available), and the app builds a dated, evidence-cited protocol to improve their numbers, then adapts that protocol over time based on retests and check-ins, coached by an AI that shows the actual study behind every recommendation and explains WHY each recommendation follows from that user's specific results.

## The problem, with numbers

- Sperm counts have fallen roughly 50% over the past 40 years.
- 1 in 6 couples face fertility issues; male factor is implicated in ~50% of cases.
- Average IVF journey is 2.5 cycles at £7,000–£8,000 per cycle, so male-factor improvement before IVF has real financial stakes.
- Improving sperm quality can increase embryo development by up to 50%, meaning fewer IVF cycles needed.

## Why this is NOT just another ExSeed or Mojo clone

Be explicit about this distinction anywhere the product explains itself:

- **ExSeed already does:** a device-based home test, a questionnaire-and-result-driven personalised lifestyle programme (free tier: questionnaire plus a 3-day food/activity record feeding tailored recommendations), and a paid 12-week programme with human coaches and video consultations. This is real personalisation. Do not build something that just re-does this.
- **What ExSeed does NOT do, and what we're building instead:**
  1. **No fixed, dated protocol with a scheduled retest cadence.** ExSeed's programme is ongoing and open-ended. We use a structured N-day protocol (default 100 days, configurable) that ends in a scheduled retest and produces a before/after comparison.
  2. **No visible citation per recommendation.** ExSeed says "science-based advice" as a category claim, not a specific source per tip. Every recommendation in our app must show the specific study it's drawn from, inline, one tap away.
  3. **No parameter-to-advice reasoning (anti-black-box).** This is our sharpest differentiator. ExSeed does not visibly link each specific result parameter (concentration, motility, morphology) to the specific advice given, with the mechanism explained. We do. See the "Parameter-to-protocol mapping and educational layer" section.
  4. **No continuous adaptive coaching.** ExSeed's plan is set after the initial questionnaire and only revisited via optional paid human calls. Our AI coach re-evaluates based on adherence data and check-ins, and adjusts the plan, not just reminds the user of it.
  5. **No richer data ingestion.** ExSeed uses a questionnaire. We fold in wearables, an uploaded hormone panel, and environmental exposures, so the protocol gets visibly more specific the more the user connects.
  6. **No named support for vasectomy reversal or fertility preservation before cancer treatment.** See the two dedicated sections below — both the opportunity and the hard limit on what we can honestly claim.

## Target user

Primary: men aged 25–45 trying to conceive (with or without a partner going through IVF) who want to actively improve their numbers.
Secondary, named explicitly in onboarding: men tracking recovery after vasectomy reversal; men preserving or monitoring fertility before or after cancer treatment.

---

## Segment: fertility preservation before cancer treatment

**This is a navigation and urgency gap, not a measurement gap — scope the feature accordingly.** Men aren't failing to bank sperm because testing is hard, they're failing because nobody hands them a clear, fast, structured pathway in the narrow window before treatment starts. Build for counselling, timeline guidance and urgency, not testing.

Supporting numbers:
- 68% of semen samples were abnormal after cancer treatment in one cohort; 23% of men developed azoospermia post-treatment.
- 15–30% of men remain permanently infertile after chemotherapy.
- Over 80% of childhood cancer patients now survive long-term, and most want biological children later, yet half of young male survivors are left at increased infertility risk by treatment.
- Uptake without intervention is low: only 43.8% of at-risk adolescent/young adult patients banked sperm before treatment; just 53.4% even attempted it.
- The fix is proven and cheap: formal nursing fertility counselling more than doubled banking rates (from ~6–8% to 17.6%). A formal oncofertility programme took one centre from 3.3% to 19.3% of patients banking.
- Single strongest predictor of banking: meeting a fertility specialist, which made a patient ~30x more likely to bank. Parental recommendation made adolescent patients ~12x more likely.
- Uptake varies hugely by cancer type: 41% for testicular cancer, 40% for Hodgkin lymphoma, just 7% for non-Hodgkin lymphoma (large French national dataset).
- Outcomes for those who do bank and use it: a 15-year programme reported a 35% cumulative live-birth rate per couple using cryopreserved sperm; pregnancy rates ranged 12% (IUI) to 32% (ICSI).

Feature implication: structured pre-treatment timeline content, a clear "do this now, before treatment begins" nudge, and navigation to real banking services. No sperm testing claims for this track.

## Segment: vasectomy reversal

**This is a genuine longitudinal-tracking opportunity — the real gap ExSeed leaves open.**

Supporting numbers:
- Across 1,469 microsurgical reversals: 86% overall patency (sperm returning to semen), 52% pregnancy rate with follow-up data. Timing matters heavily: 97% patency and 76% pregnancy if reversal is within 3 years of vasectomy, falling to 71% patency and 30% pregnancy at 15+ years.
- Specialist centres report patency as high as 90–95%, top surgeons up to 95–98%.
- Recommended monitoring protocol: first semen analysis at 4 weeks post-reversal, then every 4 weeks as directed. This is a genuine multi-month tracking need, well suited to a longitudinal app (trend charts, reminders, "your count has risen 3 tests running, consistent with expected recovery").
- Home test kits are already used for this kind of monitoring but are explicitly flagged in the literature as "not always reliable."

**Hard technical limit, must shape the feature scope: our app cannot confirm azoospermia, and neither can any smartphone-optical device, including ExSeed's.** The WHO definition of azoospermia requires centrifugation ("no spermatozoa in the sediment of a centrifuged sample"), which a phone camera cannot do. Studies show 14–20% of samples called azoospermic by less rigorous testing actually have rare sperm found on proper lab centrifugation (cryptozoospermia), so this distinction has real consequences. Do not build or claim any azoospermia/zero-count confirmation feature. Position the app purely as the tracking and trend-interpretation layer around real lab results the user enters after each real semen analysis, not as an alternative to the lab test.

---

## Core MVP features

1. **Onboarding**: short questionnaire (lifestyle, diet, exercise, smoking/alcohol, known conditions), plus an optional track selector (general / post-vasectomy-reversal / pre-treatment fertility preservation). Track selection changes framing and urgency copy, not the core mechanic.
2. **Mock test result entry**: since there's no physical device, let the user either enter results manually (volume, concentration, motility, morphology) or pick a demo sample result to see the flow. Clearly label as demo/simulated data.
3. **Protocol generation**: an LLM call takes the questionnaire + result + any connected data and generates a dated, day-by-day or week-by-week protocol (default 100 days) covering nutrition, exercise, supplementation, environmental exposure reduction, and lifestyle factors.
4. **Parameter-to-protocol reasoning + citation per recommendation**: every recommendation must show (a) which of the user's specific results it responds to, (b) the mechanism linking result to advice, and (c) a real citation. See the dedicated section below. Constrain the model to cite only from the provided evidence library; mark anything unmatched as general guidance, not evidence-backed.
5. **AI coach chat**: conversational interface where the user can ask "why this recommendation" and get the cited, mechanism-based answer, log how they're doing, and get the protocol adjusted.
6. **Retest and trend tracking**: log real (or, for demo, mock) retest results over time and show a before/after and trend comparison. For the vasectomy-reversal track, this is the entire value proposition — do not gate it behind the 100-day general protocol structure.
7. **Progress dashboard**: protocol timeline, adherence tracking, evidence library unlocked so far.
8. **Wearable connection**: connect wearables (Apple Health, Oura, Whoop, Garmin) to pull sleep, activity, strain, recovery, resting heart rate and HRV. See "Data inputs beyond the sperm test."
9. **Blood test and medical-record upload**: let the user upload a fertility hormone panel and other relevant records (PDF, image, or manual entry). See "Data inputs beyond the sperm test."
10. **Environmental exposure tracking**: AQI-driven air-pollution input plus an exposure checklist. See "Environmental / exposure factors."

---

## Parameter-to-protocol mapping and educational layer

**This is the app's signature feature and its main defence against "isn't this just ExSeed." Build it as an explicit reasoning chain, not a flat recommendation list.** Every recommendation is displayed as: the user's specific result → the mechanism → the intervention → the citation. The user should never see a recommendation without seeing why it applies to them.

The biology that makes this real (not invented): the parameters are partly distinct and partly linked, and the evidence tells you which is which. Oxidative stress is the shared mechanism sitting at the crossroads of low motility and high DNA fragmentation — reactive oxygen species damage the mitochondria powering the sperm tail AND cleave sperm DNA, which is why low motility and high DNA fragmentation travel together (in >1,000 men with isolated defects, DNA fragmentation was significantly higher in those with poor motility). DNA fragmentation is otherwise largely independent of the other parameters (one integrity study found only a weak ρ=0.21 correlation). Low testosterone degrades everything at once (concentration, motility, morphology, vitality), which is why a hormone flag legitimately reshapes the whole protocol.

Parameter-to-emphasis mapping (use to weight the protocol; pull the underlying papers before hardcoding figures):
- **Low concentration** → spermatogenic output and the hormonal axis. Emphasise: weight loss if overweight, hormone panel becomes more important, heat-exposure reduction, omega-3 (ranked first for concentration in the network meta-analysis).
- **Low motility** → oxidative stress and mitochondrial/membrane function. Emphasise: antioxidants (carnitine and CoQ10 ranked top for motility), smoking cessation, air-pollution and heat reduction.
- **Poor morphology** → overlaps with oxidative stress but is partly a distinct spermatogenic-stage issue. Antioxidant-leaning, but flag as less lifestyle-responsive and more likely to warrant specialist input.
- **High DNA fragmentation** (only if entered from a specialist test) → the smoking, advanced-age, toxin and oxidative-stress cluster. Strongest "see a clinician" flag; also the clearest case for antioxidants and exposure reduction.

Display format, per recommendation (example):
> "Your motility was 28%, below the WHO 32% threshold. Motility depends heavily on the mitochondria that power the sperm tail, which are vulnerable to oxidative stress. That's why your plan prioritises CoQ10 and carnitine [citation — 1,917-man network meta-analysis], and why cutting smoking and pollution exposure matters specifically for you."

**Guardrail 1 (integrative framing, not isolated dials):** the parameters correlate and share causes, so the app must say "your plan emphasises X because of your motility result," not pretend each factor is a clean, independent dial. The integrative view (parameters interact; oxidative stress is a common upstream driver) is the more scientifically current framing and makes the product look sharper, not vaguer.

**Guardrail 2 (direction, not a dial-a-number promise):** much of this evidence is association-level. Frame advice as shifting the oxidative-stress and hormonal environment in the right direction, never as guaranteeing a specific parameter will move by a specific amount, and never as guaranteeing conception.

---

## Data inputs beyond the sperm test

The point of these inputs is to move from a generic protocol to one shaped by the individual's actual physiology. The more of these a user connects, the more specific and less generic the protocol should visibly become — that increasing specificity is itself a selling point versus a questionnaire-only competitor. Different inputs carry different evidential weight — build them differently.

### Blood test / hormone panel (strong signal, decision-support only)

Standard male fertility panel: FSH, LH, total and free testosterone, and where indicated estradiol (E2), prolactin, SHBG, thyroid. These directly govern sperm production, so they meaningfully change what a sensible protocol looks like:
- FSH stimulates Sertoli cells to make sperm. Low FSH can indicate a pituitary/signalling problem; high FSH can indicate testicular failure/damage.
- LH signals the testes to produce testosterone; if LH is off, testosterone and sperm production can drop.
- Testosterone is essential for sperm production, but excess converts to estradiol, and elevated estradiol is associated with lower sperm production and testicular shrinkage — more is not better.
- In 338 men in subfertile couples, LH, FSH and total testosterone were each inversely associated with sperm motility after adjusting for age, BMI, smoking and alcohol — real signal, though the literature is still inconclusive on hormones as standalone biomarkers.

**Critical guardrail: interpret these as context to tailor lifestyle emphasis and to flag "these results warrant seeing a specialist," NOT to diagnose an endocrine disorder or recommend any hormone therapy (FSH, clomiphene, hCG, testosterone).** Testosterone replacement in particular suppresses sperm production, so the app must never nudge toward it. Abnormal panel → route to a clinician.

### Wearable data (contextual signal, lighter evidence — personalise and motivate, don't make strong claims)

- **Sleep** drives GnRH pulses and the testosterone rhythm; even one week of short sleep can lower testosterone. Poor sleep quality has correlated with worse semen parameters even where systemic hormones didn't differ (suggesting an oxidative-stress pathway too).
- **Strain / training load (strong and specific — maps directly onto Whoop).** In a controlled study, endurance-trained men who doubled weekly training volume for 2 weeks saw sperm count fall 43% immediately and 52% at 3 months, with testosterone dropping and cortisol rising in a tight inverse relationship (r = -0.92); both recovered ~3 months after returning to normal training. Mechanism: heavy load raises cortisol, which suppresses testosterone at the testes and disrupts the HPT axis. Whoop strain is effectively a continuous readout of this variable.
- **Recovery / HRV / resting heart rate as an overstrain proxy.** Sports science long used the testosterone-to-cortisol ratio as an overtraining marker. You can't measure hormones from a wearable, but persistently suppressed recovery, low HRV or elevated resting HR is the autonomic signature of the same elevated-cortisol state — use it to trigger a check-in or suggest a blood panel, framed as a proxy, never as a hormone measurement.
- **U-shaped curve, not "more exercise bad."** Moderate exercise improves semen parameters, testosterone and genital blood flow; only sustained overtraining flips it negative. Reward moderate activity; flag only the chronically-under-recovered extreme. Honest caveat from the overtraining study: values stayed within normal range and wouldn't be expected to affect an average man's fertility, so frame sustained high strain as "a modifiable risk if your numbers are already borderline," not "training causes infertility."
- **Scope note:** use wearable data to personalise, to track adherence objectively, and to drive nudges. Do not claim a direct wearable-to-sperm-count causal effect; the honest framing is that sleep, strain and recovery influence the hormonal environment that supports sperm production.

---

## Environmental / exposure factors

Well-evidenced and under-served. The shared mechanism across almost all of these is the same one behind the motility/DNA-fragmentation link above: they act as endocrine-disrupting chemicals (EDCs) and/or generate reactive oxygen species → oxidative stress, sperm DNA fragmentation, HPT-axis disruption. That shared mechanism is why exposure-reduction advice and antioxidant advice reinforce each other — say so in the coaching copy. Most of these are modifiable; the app's job is to surface exposures the user didn't know were relevant and give concrete reduction steps. Build in three tiers.

**Tier 1 — trackable from phone/location (live input): air pollution (PM2.5, NO2).**
Strong evidence: PM2.5 is negatively correlated with sperm motility, concentration, total count and normal morphology, via oxidative stress and DNA fragmentation. Pull local AQI from the user's location (free AQI API) and track it as an ambient exposure. This is also the best live-demo element because it updates on its own.
What the user can actually do (all evidence-backed, ordered by strength):
- **HEPA air purifier at home — the headline action.** People spend ~90% of time indoors, and randomised crossover trials show HEPA purifiers cut indoor PM2.5 by ~58–65% and reduce measured personal exposure (not just room readings). This is the standing recommendation in the protocol and one of the better-evidenced environmental interventions in medicine.
- **Well-fitted N95/equivalent respirator** on high-pollution days / near heavy traffic genuinely reduces PM2.5 exposure. Caveat to state: fit is everything; cloth/surgical masks are variable and largely unproven for PM2.5 — recommend a properly fitted N95 specifically.
- **Source control + behaviour (supporting cast, weaker health evidence):** windows closed and AC running on high-AQI days, extractor fan when cooking (a major indoor PM2.5 source), avoid indoor candles/wood-burning, no indoor smoking, HEPA-filter vacuum.
- **Timing/location (free):** on high-AQI days, move hard training indoors and reduce outdoor exertion (heavy breathing inhales more); commuters can favour less-polluted routes/times (lower confidence).
AQI-triggered feature: on a high-pollution day, fire a specific nudge ("air quality is elevated today — keep hard training indoors, run your purifier, keep windows closed").

**Tier 2 — quick onboarding + periodic checklist (structured questions):**
- **Plastics: BPA and phthalates.** Both are EDCs; higher urinary levels correlate with impaired semen parameters and oxidative stress. BPA impairs testosterone production (direct Leydig-cell + HPT-axis effects); phthalates (esp. DEHP) are plasticisers in flexible PVC, food packaging, air fresheners. Swap-based advice: glass/steel containers, don't microwave in plastic, avoid plastic-bottled water where possible, minimise thermal-paper receipts, fragrance-free household products.
- **Pesticides / herbicides** (organophosphates, atrazine; legacy DDT/DBCP): damage seminiferous tubules, disrupt hormones, impair motility and sperm DNA. Trackable via diet (conventional vs washed/organic produce) and occupation (agriculture, groundskeeping). Advice: wash produce, occupational PPE awareness.
- **Heavy metals (lead, cadmium):** oxidative stress, DNA damage, reduced concentration; cadmium is also a major component of tobacco smoke (ties into the smoking factor). Screen for smoking, occupational exposure, older plumbing.
- **Occupational heat and toxin exposure:** ties to the heat-exposure evidence in the library, plus solvents, natural gas/oil, industrial chemicals. A few onboarding questions.
- **Radiation:** keep modest — screen for occupational ionising-radiation exposure; treat "laptop on lap" primarily via its heat mechanism, not an overclaimed radiation effect.

**Tier 3 — educational only (surface as content, don't track): PCBs, dioxins, furans.** Real evidence but not individually modifiable day-to-day; awareness content, not a tracked factor.

Guardrail: much of this is association-level (some studies report no association). Frame as "modifiable exposures worth reducing, especially if your numbers are borderline," not guaranteed causes of a given user's result. Reducing exposure lowers oxidative stress on sperm; it is not a promised count increase. Keep citation-per-recommendation discipline; pull underlying papers before hardcoding any figure.

---

## Evidence library to seed (real figures — verify before hardcoding, do not invent numbers)

Whoever builds this must pull the actual papers behind each line before shipping any claim in-app. Starting point, already sourced:

**Antioxidant / supplement interventions:**
- CoQ10: sperm concentration increase (mean difference 5.95, 95% CI 0.05–10.79) vs placebo in a network meta-analysis; also motility (MD 7.33, CI 0.35–14.17).
- L-carnitine: top-ranked for motility (WMD 6.52%, CI 2.55–10.05%) and morphology (WMD 4.96%, CI 0.20–9.73%) in a 23-RCT, 1,917-patient network meta-analysis.
- Omega-3: top-ranked for sperm concentration (WMD 9.89 million/ml, CI 7.01–12.77) in the same analysis; a separate RCT (1,840mg/day, 32 weeks) improved motility, concentration, morphology and antioxidant status.
- Selenium + vitamin E: motility MD 13.56%, morphology MD 0.69%, vitality MD 23.24% across 8 studies/736 participants — no significant effect on volume, count or concentration alone.
- General antioxidant supplementation (9 studies): concentration significantly increased (MD 4.00, CI 0.96–7.05).
- Caveat to include in-app: antioxidants did NOT show a significant pregnancy-rate effect in the largest network meta-analysis, and didn't help varicocele-associated infertility without prior oxidative-stress screening — don't overclaim to "pregnancy," only to sperm parameters.

**Weight loss / exercise:**
- 8-week low-calorie diet (Danish RCT, obesity cohort): sperm quality improved 40% within 8 weeks; maintained at 1 year only if weight loss was maintained (via exercise or GLP-1 therapy).
- Severely obese men, median 15% weight loss: total sperm count rose significantly; largest-loss subgroup +193 million (95% CI 45–341) total count, +4 points morphology.
- Lifestyle-intervention meta-analysis: progressive motility +10.56 points (CI 8.97–12.15), normal morphology +0.59 (CI 0.23–0.94).
- Exercise in overweight/obese men: volume, concentration and morphology improved (e.g. concentration 48.5→55.8 million/ml).
- Caveat: rapid weight loss via bariatric surgery impaired sperm production — recommend gradual diet-and-exercise loss, not rapid/surgical.

**Smoking cessation:**
- Sperm take ~64–74 days to mature, so meaningful improvement needs ~3 months post-cessation.
- 90 heavy smokers: after cessation, volume, concentration, total count, progressive motility, total motility and morphology all improved significantly (P<0.001), improvement correlated with time since quitting.
- Nicotine-driven sperm DNA methylation changes reversed after short-term cessation (human/mouse data).

**Heat exposure:**
- Scrotal temperature rose 2.1°C after 60 minutes of thighs-together sitting — relevant to "laptop on lap" advice.
- Classic studies: count drop peaks ~4–5 weeks after heat exposure, recovery ~10–12 weeks; one controlled study found recovery within 4 weeks of a single 30-min 43–47°C scrotal heating episode.

**Sperm parameters and DNA fragmentation (for the educational layer):**
- Oxidative stress sits at the crossroads of motility loss and DNA fragmentation (ROS damage tail mitochondria and cleave DNA).
- In >1,000 men with isolated defects, DNA fragmentation was significantly higher in men with poor motility (~31% had DFI >30%).
- DNA fragmentation is otherwise largely independent of other parameters (integrity study, ρ=0.21).
- Low testosterone globally degrades concentration, motility, morphology and vitality.

Still to research and cite properly before shipping (don't fabricate numbers): folate/zinc on concentration, sleep duration/quality vs testosterone, alcohol reduction specifically (separate from smoking), morphology-specific interventions, and the parameter-specific effect sizes for the mapping above.

---

## Guardrails (must be respected in all copy and AI outputs)

- Never present this as a diagnosis or a replacement for a real lab/clinical test.
- Never build or claim azoospermia/zero-sperm-count confirmation — see the vasectomy-reversal section.
- Never diagnose an endocrine disorder from an uploaded blood panel, and never recommend or nudge toward hormone therapy (FSH, clomiphene, hCG, and especially testosterone, which suppresses sperm production). Abnormal hormone results route the user to a clinician; the app tailors lifestyle emphasis only.
- Every recommendation must (a) link to the user's specific result with a stated mechanism and (b) cite a real source from the evidence library, or be clearly labelled as general guidance, not evidence-backed. Do not let the model free-generate citations.
- Integrative framing, not isolated dials: parameters interact and share upstream causes (oxidative stress, hormones); don't present each as an independent lever.
- Direction, not a dial-a-number promise: advice shifts the oxidative-stress/hormonal environment; it does not guarantee a specific parameter change or conception.
- No claims of guaranteed pregnancy outcomes — evidence supports sperm-parameter improvement, not guaranteed conception.
- Environmental and wearable claims stay at "modifiable factor / influences the environment that supports sperm production," not guaranteed cause/effect on a given user's count.
- Visible disclaimer throughout: "This is a research prototype using simulated test data. Not a medical device. Consult a clinician for real testing and before making significant lifestyle or supplement changes."
- Mock/demo data must be clearly labelled as such anywhere it appears in the UI.

## One-line positioning for the pitch deck

"ExSeed personalises your lifestyle plan. We give you a dated, evidence-cited protocol that shows its working — linking each of your specific results to the exact advice and the study behind it — adapts as you connect wearables, bloods and environment, and is the only one speaking to men rebuilding their fertility after reversal or before treatment."