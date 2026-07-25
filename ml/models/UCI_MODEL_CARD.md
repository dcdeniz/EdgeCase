# UCI Fertility screening research card

- Model ID: `preseed-uci-fertility-screen`
- Version: `0.2.0`
- Status: research-only; runtime blocked
- Dataset: UCI Fertility, DOI `10.24432/C5Z01Z`, CC BY 4.0
- Participants: 100 (88 normal, 12 altered)
- Selected procedure: `prevalence_threshold_forest`

## Intended question

Can nine questionnaire-style variables discriminate the UCI dataset's historical
normal/altered semen-quality label under repeated nested held-out validation?

This is not a fertility, conception, semen-count, motility, morphology, or diagnostic
model. It is completely separate from the deterministic readiness score.

## Validation

- Repeated nested stratified cross-validation:
  5 outer folds ×
  5 repeats.
- Preprocessing, imbalance handling, calibration, hyperparameter selection, and
  threshold selection occur only inside training data.
- Probabilities use nested sigmoid calibration.
- The operating threshold is selected from inner out-of-fold predictions by balanced
  accuracy; outer test folds never tune it.

## Held-out result

| Metric | Selected model | Always-normal baseline |
| --- | ---: | ---: |
| Raw accuracy | 0.600 | 0.880 |
| Balanced accuracy | 0.665 | 0.500 |
| Sensitivity | 0.750 | 0.000 |
| Specificity | 0.580 | 1.000 |
| AUROC | 0.671 | 0.500 |
| PR-AUC (average precision) | 0.265 | 0.120 |
| Brier score | 0.101 | 0.120 |
| Calibration error | 0.018 | 0.120 |

The requested 0.90 held-out balanced-accuracy target
did not pass. Raw accuracy is not the target:
an all-normal classifier already achieves 0.88 while detecting zero altered cases.

## Adaptive second-pass disclosure

The selected procedure uses a threshold equal to the altered-case prevalence in each
outer training fold. This avoids fitting an unstable threshold to approximately nine
altered training examples. It increased sensitivity, but also increased false positives.

This operating point was designed after reviewing the initial cross-validation result,
so its performance is exploratory rather than an untouched confirmation estimate.
Balanced accuracy across additional complete seed runs was 0.642 (seed 7), 0.636 (seed 42), 0.583 (seed 2026), 0.665 (seed 20260725).
The variation is material and reinforces the runtime block.

Methods screened but not retained:
- balanced random forest
- balanced extremely randomized trees
- fold-local univariate feature selection plus logistic regression
- regularized soft-voting ensemble
- season-as-nominal balanced forest
- shrinkage linear discriminant analysis
- regularized quadratic discriminant analysis
- distance-weighted nearest neighbors

## Export decision

No executable runtime artifact is exported because the dataset cannot support a validated individual screening feature. The manifest preserves the selected research procedure and held-out result.

## Limitations

- Only 100 participants and 12 altered labels
- No participant identifiers to audit duplicates or repeated measures
- No external, temporal, clinic, geographic, or prospective validation
- The target is a coarse historical normal/altered label, not a named semen endpoint
- The improved operating point was developed adaptively after reviewing the initial CV

## Compatible-data audit

- **VISEM (CC BY-NC 4.0):** do not pool rows with UCI. Its feature and continuous
  endpoint contract is different.
- **Spermiogram data n=308 (CC BY 4.0):** potentially useful as a separate future
  cohort, but it has different predictors and outcomes plus masked identifiers, exact
  birth dates, and sensitive health fields requiring privacy and ethics review.
- **Advanced ejaculate methods n=107 (CC0):** contains semen and post-processing
  measurements but lacks compatible pre-test lifestyle inputs. Using semen values to
  predict its semen classification would be target leakage.

No additional dataset passed the licence, predictor, target, provenance, and privacy
checks required for direct pooling with UCI.

## Concrete data-collection plan

Provisional planning targets, to be replaced by formal biostatistical power analysis:

1. Recruit at least 300 development participants with at least 100 below-reference
   examples for each pre-registered named endpoint.
2. Hold out at least 200 additional participants from two or more unseen clinics for
   external validation.
3. Obtain two standardized baseline semen analyses where feasible, 60–90 days of
   strictly preceding wearable, food, substance, illness, medication, and heat data,
   then one follow-up analysis.
4. Preserve participant, clinic, laboratory, geography, time, collection conditions,
   device, provenance, missingness, consent, and withdrawal metadata.
5. Model progressive motility, concentration, total count, and morphology separately;
   do not recreate a generic fertile/infertile label.

## Appropriate hackathon presentation

Show this only as an **Experimental UCI screen** with the dataset size, class
imbalance, uncertainty, model version, and a prompt for real semen testing. Do not
call its output fertility, normal/infertile, or an expected individual improvement.
