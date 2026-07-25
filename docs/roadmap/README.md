# Product and technical roadmap

- Status: Proposed
- Last updated: 2026-07-25
- Product: Evidence-backed male reproductive-health readiness and semen-quality risk platform

This roadmap turns the [male fertility evidence landscape](../research/male-fertility-evidence-landscape.md) into an implementation plan for EdgeCase.

## Product model

EdgeCase should combine four separate outputs rather than presenting one opaque fertility number.

### Clinical profile

Measured information only:

- semen concentration, total count, motility, morphology, volume, and DNA fragmentation;
- testosterone, FSH, LH, and other relevant blood markers; and
- relevant diagnoses, treatments, and genetic findings.

### Readiness score

A transparent 0–100 measure of modifiable, evidence-supported behaviours. It should respond to sustained changes in sleep, activity, diet, alcohol, nicotine, heat, and relevant environmental exposures.

The readiness score does not claim that sperm quality changed.

### Semen-quality risk estimate

An ML estimate of a named endpoint, such as increased risk of below-reference progressive motility. It must include a model version, uncertainty, data-coverage warning, and explanation. Begin with risk bands rather than precise probabilities.

### Data confidence

A separate indication of how much trustworthy data supports the other outputs. Inputs include clinical-test availability, repeat-sample comparability, wearable coverage, log completeness, recency, and verified versus self-reported provenance.

## System flow

```text
Clinical tests ─┐
Wearables ──────┼─> feature engine ─> readiness score ─┐
Food and logs ──┤                  ├> risk model ───────┼─> dashboard
Exposures ──────┘                  └> recommendations ──┘
                                          │
Evidence registry ────────────────────────┘

Dashboard ─> 12-week experiment ─> follow-up test ─> measured change
```

## Readiness-score design

Start with a versioned deterministic rules engine. ML should estimate clinical endpoints, not secretly control the behaviour score.

An initial hypothesis for clinical review:

| Domain | Weight |
| --- | ---: |
| Sleep and circadian health | 20 |
| Alcohol, smoking, and drugs | 20 |
| Diet quality | 15 |
| Activity and metabolic health | 15 |
| Heat exposure | 10 |
| Sexual and reproductive health | 10 |
| Environmental exposure reduction | 10 |

The calculation is a weighted average of available domain scores. Missing data should reduce confidence rather than automatically reduce readiness.

Clinical red flags do not behave like ordinary point deductions. Exogenous testosterone, anabolic steroids, chemotherapy, severe testicular history, suspected obstruction, and major abnormal results should create a clinical gate or escalation pathway. Good diet and sleep cannot cancel a potentially sperm-suppressing treatment.

### Time windows

Use windows appropriate to the feature:

- sleep and diet: trailing 14–30 days;
- activity and sedentary time: trailing 28 days;
- alcohol and heat exposure: trailing 30 days;
- weight and metabolic trend: trailing 60–90 days;
- medication, developmental, and clinical history: persistent context; and
- semen-relevant aggregate features: approximately the preceding 60–90 days.

Smooth the displayed score so that one unusual day does not produce a dramatic change:

```text
displayed score =
  0.85 × previous displayed score +
  0.15 × newly calculated score
```

The precise smoothing factor is a product hypothesis and must be tested.

### Score explanations

Every score change should identify:

- the observation;
- the affected domain;
- the number of readiness points;
- the time window;
- evidence confidence;
- whether the evidence is causal or observational; and
- the clinical endpoint studied.

Example:

> Readiness increased from 58 to 66. Sleep consistency contributed +3, lower alcohol exposure +2, dietary diversity +1, activity +1, and reduced heat exposure +1. This is behavioural progress; follow-up testing is required to determine whether semen parameters changed.

## Evidence registry

Create a machine-readable registry behind scoring and recommendations.

```json
{
  "factor": "sleep_duration",
  "claim": "Poor sleep has been associated with lower semen measurements",
  "endpoints": [
    "sperm_concentration",
    "total_sperm_count",
    "total_motile_count"
  ],
  "direction": "adverse",
  "evidence_level": "moderate",
  "evidence_type": "prospective_observational",
  "causal": false,
  "modifiable": true,
  "maximum_readiness_points": 4,
  "source_url": "https://pubmed.ncbi.nlm.nih.gov/41330355/",
  "last_reviewed": "2026-07-25",
  "clinical_review_status": "pending"
}
```

The registry should drive evidence cards, scoring limits, recommendation eligibility, citations, user-facing language, and review reminders.

## Proposed data model

Keep the existing `profiles` table. Replace the placeholder `notes` domain when implementation begins.

### Planning

`fertility_goals`

- user and target date;
- trying-now status;
- planning horizon; and
- created and updated timestamps.

### Clinical

`clinical_tests`

- test type, date, laboratory, and source-file reference;
- verification status;
- abstinence duration;
- collection location and completeness;
- transport duration and temperature context; and
- recent fever or acute illness.

`clinical_markers`

- test reference;
- marker code, value, and unit;
- laboratory reference distribution;
- extraction confidence; and
- user-confirmed status.

A marker table is preferable to one database column per blood or semen endpoint.

### Daily behaviour

`daily_logs`

- date, mood, stress, libido, illness, and notes.

`food_entries`

- consumption time, meal type, image reference, description;
- estimated nutrients and dietary categories; and
- estimation confidence and confirmation.

`substance_entries`

- substance, amount, unit, time, source, and duration context.

`exposure_entries`

- exposure type, time, duration, intensity, context, and evidence-factor reference.

### Wearables

`wearable_connections`

- provider, connection status, external identifier, last synchronization, and secure token reference.

`wearable_daily_summaries`

- provider, date, device model;
- sleep timing, duration, efficiency, and regularity;
- steps, active minutes, sedentary minutes;
- resting heart rate, HRV, and energy expenditure; and
- raw-data reference where retention is permitted.

Never store wearable access tokens in ordinary application fields.

### Scores and experiments

`score_snapshots`

- readiness and confidence scores;
- rule and model versions;
- domain scores and explanation; and
- calculation timestamp.

Store snapshots rather than overwriting the current score so changes remain auditable.

`recommendations`

- factor, explanation, possible readiness points, evidence level, and status.

`experiments`

- recommendation, start and end date, target, baseline, outcome, and status.

`evidence_claims`

- the versioned evidence registry.

`model_versions`

- name, version, target, training data, metrics, calibration results, artifact reference, and deployment status.

## Runtime pipeline

When a user records or imports information:

1. Validate, normalize, and attach provenance.
2. Store the raw observation.
3. Update 7-, 14-, 30-, 60-, and 90-day aggregate features as relevant.
4. Run the deterministic readiness rules.
5. Run the risk model only when its eligibility and data-coverage requirements are met.
6. Generate a factor-level explanation.
7. Select eligible recommendations.
8. Store a versioned score snapshot.
9. Update the dashboard and experiment progress.

Example: if a user logs four pints on Saturday, normalize the entry to estimated UK alcohol units, retain estimation uncertainty, update alcohol windows, recalculate the substance domain, smooth the displayed score, and explain any change. Do not infer an immediate sperm-count change.

## ML strategy

### Targets

Train models against named continuous clinical endpoints where possible:

- sperm concentration;
- total count;
- progressive motility;
- normal morphology; and
- DNA-fragmentation index.

A secondary task can estimate the probability that a marker falls below a declared reference distribution. Do not train a generic `fertile` label.

### Feature windows

For each semen sample, construct features only from information available before that sample, normally from the preceding 60–90 days:

- sleep mean, variability, and short-sleep nights;
- activity, training load, and sedentary time;
- alcohol amount and binge episodes;
- nicotine and other substance exposure;
- dietary diversity and pattern scores;
- heat exposure;
- fever and illness;
- BMI, waist measurement, and weight change;
- medications and hormone exposure;
- age and relevant clinical history;
- abstinence duration; and
- collection and laboratory conditions.

Information recorded after the sample must not enter the training row.

### Dataset priorities

- **LIFE Study**: valuable because it connects environmental exposures, semen biomarkers, lifestyle, time to pregnancy, and couple-level outcomes; access is controlled.
- **VISEM**: 85-participant public multimodal dataset suitable for semen-video and pipeline prototypes, not a general population model.
- **VISEM-Tracking**: useful for computer vision, tracking, and motility research.
- **N-SEED**: close to the desired architecture but currently more useful as a protocol reference.
- **UCI Fertility data**: tutorial-scale only; it is too small and coarse for a medical score.
- **Prospective EdgeCase cohort**: the necessary long-term asset, combining standardized repeat tests with preceding wearable, food, medication, and exposure data.

See the [research dataset notes](../research/male-fertility-evidence-landscape.md#datasets).

### Initial models

Start with:

1. regularized linear and logistic regression;
2. gradient-boosted trees such as LightGBM or XGBoost; and
3. simple clinical baselines.

Compare:

- age and BMI only;
- clinical history only;
- previous semen result only;
- clinical history plus lifestyle; and
- clinical history, lifestyle, and wearables.

The important experiment is whether food and wearable data improve validated performance beyond simple clinical history and a previous result.

### Validation

Split by participant, never individual row. Use:

- participant-level separation;
- clinic and geographic external holdouts;
- temporal holdout;
- prospective silent validation; and
- subgroup evaluation.

For regression, report MAE, RMSE, calibration, and prediction-interval coverage. For classification, add sensitivity, specificity, AUROC, Brier score, and calibration curves. Report performance by age, relevant diagnosis, demographic groups, geography, and device type.

Primary risks include confounding, reverse causality, clinic-selection bias, data leakage, multiple testing, correlated exposures, device-specific errors, missing-not-at-random data, and regression to the mean.

## Model implementation

Use Python for offline training:

```text
ml/
├── README.md
├── data/
│   └── README.md
├── notebooks/
├── src/
│   ├── features.py
│   ├── train.py
│   ├── evaluate.py
│   └── export.py
├── models/
│   └── model-manifest.json
└── tests/
```

Do not commit private or restricted clinical data.

For the first deployed model:

1. train offline;
2. export a small linear or logistic model and preprocessing specification as JSON;
3. implement versioned inference in a Supabase Edge Function;
4. return the estimate, uncertainty, eligibility status, and contributing factors; and
5. store the model version with every prediction.

More complex models can later run behind a private Python inference service called by an authenticated Edge Function. The browser must not call the model service directly.

## Recommendation engine

Recommendations come from score gaps, evidence eligibility, safety exclusions, and user goal.

```text
if sleep domain < 60
and wearable coverage >= 10 nights
and no active shift-work exception:
  offer sleep-consistency experiment
```

Every recommendation should contain:

- the observed pattern;
- a manageable action;
- difficulty and duration;
- possible readiness points;
- evidence level and studied endpoint;
- safety exclusions; and
- paper or guideline links.

Offer one to three experiments at a time.

## Goal-date behaviour

### Trying now or within three months

- prioritize a clinical baseline and comparable testing;
- surface clinical red flags;
- focus on high-evidence actions; and
- recommend professional evaluation when indicated.

### Within one year

- run approximately three or four 12-week cycles;
- establish baseline, change behaviour, retest, and refine; and
- show behavioural and clinical changes separately.

### Several years away

- prioritize sustainable habits and avoidance of major reproductive risks;
- avoid unnecessary frequent testing; and
- offer baseline assessment where appropriate.

The target date changes the plan and urgency, not the underlying biological claim.

## Delivery roadmap

### Phase 1: complete vertical slice

- [ ] Signup and login
- [ ] Goal-date onboarding
- [ ] Manual semen-result entry
- [ ] Baseline reproductive and lifestyle questionnaire
- [ ] Daily sleep, alcohol, activity, diet, and heat logs
- [ ] Versioned deterministic readiness score
- [ ] Evidence-backed score explanation
- [ ] Three recommendation cards
- [ ] Historical score chart
- [ ] Mock wearable dataset for the demo

### Phase 2: automated ingestion

- [ ] Apple Health or Health Connect import
- [ ] Clinical-report upload and OCR
- [ ] Food-photo processing
- [ ] Barcode and receipt scanning
- [ ] Exposure logging
- [ ] Confirmation workflow for extracted values
- [ ] Data provenance and confidence calculation

### Phase 3: experiments and follow-up

- [ ] 12-week experiment plans
- [ ] Weekly targets and adherence
- [ ] Reminder and review flows
- [ ] Before-and-after readiness comparison
- [ ] Follow-up semen-test workflow
- [ ] Collection-condition comparability checks

### Phase 4: experimental ML

- [ ] Dataset access and governance review
- [ ] Reproducible feature pipeline
- [ ] Simple clinical baselines
- [ ] Regularized and boosted-tree models
- [ ] Participant-level validation
- [ ] Model registry and versioned inference
- [ ] Experimental-risk UI with uncertainty

Predictions remain labelled as research or experimental until prospective validation is complete.

### Phase 5: prospective validation

- [ ] Multi-site research protocol
- [ ] Consent and privacy model
- [ ] Standardized repeat semen testing
- [ ] Approximately 90 days of preceding behavioural data
- [ ] External and silent prospective validation
- [ ] Behaviour-change outcome study
- [ ] Separate semen and couple-level reproductive outcome studies
- [ ] Clinical and regulatory review

## Hackathon demonstration

The first convincing demonstration does not require a clinically validated ML model:

> Benjamin uploads a semen analysis, sets a goal date, and connects wearable-style data. EdgeCase calculates a transparent readiness score, identifies sleep, alcohol, diet, and heat as his largest modifiable opportunities, and proposes three experiments. His readiness score changes as his behaviour changes. After approximately 12 weeks, a follow-up semen analysis determines whether his measured clinical profile changed.

This proves the user loop while creating the architecture needed for later ML development.

## Definition of success

The first product milestone is complete when a user can:

1. create an account and set a fertility goal;
2. enter a clinical baseline;
3. log or import at least four modifiable factors;
4. understand every component of the readiness score;
5. select and complete an evidence-backed experiment;
6. see behavioural progress without a false clinical claim; and
7. compare a follow-up clinical test under documented collection conditions.
