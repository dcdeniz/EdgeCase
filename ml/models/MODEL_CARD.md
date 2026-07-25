# Model card: preseed-visem-progressive-motility 0.1.0

- Status: research-only, non-commercial
- Trained at: 2026-07-25T00:00:00Z
- Target: progressive motility percentage
- Dataset: VISEM, DOI [10.5281/zenodo.2640506](https://doi.org/10.5281/zenodo.2640506)
- Licence: CC BY-NC 4.0

## Intended use

This artifact is a reproducible hackathon research baseline. It explores whether age,
BMI, abstinence duration, and optionally five serum hormones can estimate progressive
motility in the 85-person VISEM dataset.

It is not a fertility score, diagnosis, conception estimate, medical device, or
replacement for standardized semen analysis. Commercial use is prohibited by the
training-data licence.

## Features and leakage controls

The core model uses age, BMI, and abstinence duration. The extended model adds serum
total testosterone, estradiol, SHBG, FSH, and LH. Semen measurements, microscopy
features, seminal-plasma markers, fatty acids, and target-adjacent variables are
excluded. Median imputation and scaling are fit inside every training fold.

## Evaluation

Selection uses original-scale mean absolute error under deterministic repeated nested
five-fold cross-validation at participant level. Secondary metrics are RMSE, Spearman
correlation, R², fold distributions, and participant bootstrap intervals.

| Feature set | Selected | MAE | RMSE | Spearman | R² | Promotion gate |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| core | ridge | 17.067 | 20.141 | 0.149 | -0.008 | FAIL |
| core+hormones | ridge | 16.814 | 19.882 | 0.283 | 0.018 | FAIL |

The promotion gate requires at least 10% lower MAE than the fold-specific mean baseline,
a positive median held-out R², and a linear export. A failed gate is retained as a valid
research result and blocks runtime display.

## Uncertainty

The artifact stores a symmetric 80% interval derived from the absolute 80th percentile
of repeated out-of-fold residuals. It is an empirical research interval, not a clinical
confidence interval and not a guarantee of coverage for an individual.

## Limitations

- VISEM contains only 85 participants and does not provide multi-site external validity.
- There is no prospective, temporal, geographic, site, or subgroup validation.
- Hormone measurements and assays may not match user-entered results.
- No wearable, food, product, or environmental longitudinal input is present.
- The model estimates one semen parameter, not fertility or reproductive success.
- Follow-up clinical testing is required to determine whether a measured value changed.

## Ethical and safety constraints

Do not use this model for diagnosis, treatment, medication changes, commercial purposes,
fertile/infertile labels, or conception/pregnancy/live-birth probabilities. Do not let
its output alter PreSeed's deterministic readiness score, clinical gates,
recommendations, or evidence selection.

## Reproducibility

See [`../README.md`](../README.md). Machine-readable metrics are in
[`../reports/evaluation.json`](../reports/evaluation.json), and the versioned artifact
is `preseed-visem-progressive-motility.v0.1.0.json` in this directory.
