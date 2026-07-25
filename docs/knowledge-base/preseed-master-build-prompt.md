# PreSeed — Master Build Prompt

> Source status: product brief supplied by the founder on 2026-07-25. Medical figures below are evidence-library candidates, not publication-ready claims. Pull and verify the underlying papers before hardcoding any figure or displaying it to users.

## Product and assumption

PreSeed is a personalised, adaptive fertility-improvement app for men. The MVP is general-purpose for any man tracking fertility. Vasectomy reversal and fertility preservation before cancer treatment are onboarding tracks, not separate products.

A user records a sperm-test result—manual or clearly simulated for the hackathon—and receives a dated, evidence-cited protocol. The protocol adapts after retests and check-ins. An AI coach must show the study and mechanism behind each recommendation and explain why it follows from that user's specific results.

## Problem and positioning

Evidence candidates supplied for verification: sperm counts have fallen roughly 50% over 40 years; one in six couples face fertility issues; male factor is implicated in roughly half; an average IVF journey is 2.5 cycles at £7,000–£8,000 per cycle; improving sperm quality may increase embryo development by up to 50%.

PreSeed must not claim that ExSeed lacks personalisation. ExSeed already provides device-based home testing, questionnaire/result-driven lifestyle recommendations, and a paid 12-week programme with human coaching.

PreSeed's differentiation is:

1. A fixed, dated protocol—default 100 days, configurable—ending in a scheduled retest and before/after comparison.
2. A visible, specific citation attached to every evidence-backed recommendation.
3. An explicit reasoning chain: result parameter → mechanism → intervention → citation.
4. Continuous AI-led adaptation from adherence and check-ins, not reminders alone.
5. Richer inputs: wearables, hormone panels/records, and environmental exposure.
6. Named, carefully scoped support for vasectomy reversal and pre-treatment fertility preservation.

Pitch positioning: “ExSeed personalises your lifestyle plan. We give you a dated, evidence-cited protocol that shows its working—linking each of your specific results to the exact advice and study behind it—adapts as you connect wearables, bloods and environment, and is the only one speaking to men rebuilding fertility after reversal or before treatment.”

## Users and tracks

Primary: men aged 25–45 trying to conceive, including couples considering or undergoing IVF. Secondary tracks: recovery after vasectomy reversal; fertility preservation before or after cancer treatment.

### Pre-treatment fertility preservation

This is a navigation and urgency problem, not a measurement problem. Build counselling, timeline guidance, “do this now, before treatment begins” nudges, and navigation to real banking/specialist services. Make no sperm-testing claim for this track.

Evidence candidates supplied for verification include: 68% abnormal semen samples and 23% azoospermia after treatment in one cohort; 15–30% permanent infertility after chemotherapy; low banking/attempt rates; counselling and formal oncofertility programmes materially increasing banking; specialist contact as the strongest predictor; large uptake variation by cancer type; and a reported 35% cumulative live-birth rate per couple using cryopreserved sperm in one long programme.

### Vasectomy reversal

This is a longitudinal lab-result tracking opportunity. Supplied evidence candidates include 86% overall patency and 52% pregnancy across 1,469 microsurgical reversals, with outcomes strongly dependent on time since vasectomy. Recommended monitoring begins with a real semen analysis around four weeks post-reversal and repeats as clinically directed. Build trend charts, reminders, and cautious recovery-language around results entered from real labs.

Hard limit: PreSeed cannot confirm azoospermia or zero sperm. WHO confirmation requires centrifugation; smartphone optics cannot do this, and less rigorous tests can miss rare sperm. The app is a tracking and interpretation layer around real lab results, never a lab-test replacement.

## MVP capabilities

1. Onboarding questionnaire: lifestyle, diet, exercise, smoking/alcohol, conditions, and general/reversal/pre-treatment track.
2. Manual or demo semen-result entry: volume, concentration, motility, morphology; demo data visibly labelled simulated.
3. Configurable dated protocol, default 100 days, covering nutrition, exercise, supplements, exposure reduction, and lifestyle.
4. Per-recommendation parameter reasoning and citations constrained to an approved evidence library. Unmatched advice is labelled general guidance.
5. AI coach that answers “why?”, logs adherence/check-ins, and proposes bounded protocol adjustments.
6. Retest and trend tracking; reversal tracking must not be gated by the 100-day general flow.
7. Dashboard: timeline, adherence, progress, and evidence unlocked.
8. Wearable connections: Apple Health, Oura, Whoop, Garmin for sleep, activity, strain, recovery, resting heart rate, and HRV.
9. Hormone-panel and medical-record upload: PDF/image/manual entry.
10. Environmental tracking: location AQI plus structured exposure checklist.

## Signature reasoning model

Every recommendation renders:

> User result → biological mechanism → intervention → verified citation

Example form: “Your motility was 28%, below the configured reference range. Motility depends on mitochondria that are vulnerable to oxidative stress. This is why your plan emphasises CoQ10/carnitine and exposure reduction. [specific approved citation]” Reference ranges must be versioned and clinically sourced; do not silently hardcode the example threshold.

Parameter emphasis:

- Low concentration: spermatogenic output/hormonal axis; weight management when appropriate, hormone-panel importance, heat reduction, omega-3 evidence candidate.
- Low motility: oxidative stress and mitochondrial/membrane function; antioxidant evidence candidates, smoking cessation, pollution and heat reduction.
- Poor morphology: overlapping oxidative stress plus partly distinct spermatogenic-stage factors; more cautious lifestyle claims and stronger specialist escalation.
- High DNA fragmentation, only from a specialist test: smoking/age/toxin/oxidative-stress cluster and the strongest clinician flag.

Biological framing: parameters partly overlap. Oxidative stress may link poor motility and DNA fragmentation; testosterone/hormonal context can affect multiple parameters. Say “the plan emphasises X because of Y,” never imply independent dials.

Direction, not promises: association-level evidence can justify shifting the oxidative-stress or hormonal environment, not predicting a numerical improvement, conception, or pregnancy.

## Additional data inputs

### Hormone panels: strong contextual signal, decision support only

Potential inputs: FSH, LH, total/free testosterone and, when clinically indicated, estradiol, prolactin, SHBG, and thyroid markers. Use these only to adjust lifestyle emphasis and surface “see a specialist.” Never diagnose an endocrine disorder or recommend FSH, clomiphene, hCG, testosterone, or other hormone therapy. Testosterone replacement can suppress sperm production and must never be nudged.

### Wearables: contextual signal, lighter evidence

- Sleep informs recovery and hormonal context; do not overclaim direct semen effects.
- Sustained high training strain plus poor recovery can trigger a check-in or suggest discussing a blood panel.
- HRV/resting heart rate are proxies, never hormone measurements.
- Preserve the U-shaped framing: moderate exercise may help; only persistent under-recovered extremes are flagged, especially when results are borderline.
- Supplied candidate: a controlled overtraining study reported count reductions after sharply increased endurance load and recovery after returning to normal. Verify before use and retain its caveat that values stayed within normal range.

## Environmental exposures

Shared framing: many exposures may act through endocrine disruption and/or oxidative stress. Most evidence is associative; recommend practical reduction, not guaranteed improvement.

Tier 1, live location input: PM2.5/NO2 AQI. Candidate actions include HEPA filtration, well-fitted N95 on high-pollution days, source control, windows/AC choices, cooking extraction, avoiding indoor smoke/candles, and moving hard exercise indoors. Verify supporting intervention evidence before claims.

Tier 2, onboarding/checklist: BPA/phthalates, pesticides/herbicides, lead/cadmium, smoking, occupational heat/toxins, and occupational ionising radiation. Offer concrete low-risk swaps/PPE awareness. Treat “laptop on lap” primarily as heat, not an overclaimed radiation effect.

Tier 3, educational only: PCBs, dioxins, and furans—real but not useful for day-to-day personal tracking.

## Evidence-library seeds to verify

- CoQ10: supplied network-meta-analysis estimates for concentration and motility.
- L-carnitine: supplied 23-RCT/1,917-patient ranking and effect estimates for motility/morphology.
- Omega-3: supplied concentration ranking plus separate 1,840 mg/day, 32-week RCT.
- Selenium + vitamin E: supplied eight-study/736-participant estimates.
- General antioxidants: supplied nine-study concentration estimate.
- Critical caveat: largest network meta-analysis reportedly did not show significant pregnancy-rate benefit; do not convert parameter evidence into conception claims.
- Gradual weight loss/exercise: supplied Danish RCT, severe-obesity cohort, lifestyle meta-analysis, and exercise cohort figures; rapid/bariatric weight loss may impair production.
- Smoking cessation: supplied 90-heavy-smoker study and methylation-reversal evidence; sperm maturation means change requires months.
- Heat: supplied sitting-temperature and controlled heating/recovery observations.
- Parameter/fragmentation relationship: supplied >1,000-man isolated-defect study, weak-correlation integrity study, and testosterone-wide-effect framing.

Still requires research before use: folate/zinc, sleep/testosterone, alcohol reduction independent of smoking, morphology-specific interventions, parameter-specific effect sizes, every numeric claim above, current reference ranges, and every paper identifier/URL.

## Non-negotiable safety and copy guardrails

- Research prototype, not diagnosis, medical device, or substitute for laboratory/clinical testing.
- Never confirm or claim azoospermia/zero count.
- Never diagnose endocrine disease or recommend hormone treatment; abnormal hormones route to clinicians.
- Every evidence-backed recommendation links a user result, mechanism, intervention, and allow-listed real source. Models cannot invent citations.
- Label uncited material “general guidance,” not evidence-backed.
- Use integrative framing, not independent biological dials.
- Promise direction/support, never a specific parameter change, conception, or pregnancy.
- Keep environmental/wearable outputs at “modifiable contextual factor.”
- Visible disclaimer: “This is a research prototype using simulated test data. Not a medical device. Consult a clinician for real testing and before making significant lifestyle or supplement changes.”
- Clearly label mock/demo data everywhere it appears.
- Pre-treatment users get urgency/navigation to care, not testing claims.
- Reversal users track real lab results; no phone-based confirmation.
