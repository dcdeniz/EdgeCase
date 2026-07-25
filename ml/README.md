# PreSeed ML research workspace

This Python 3.12 workspace builds a reproducible, non-commercial VISEM baseline for one
named endpoint: progressive motility percentage. It does **not** predict fertility,
conception, pregnancy, diagnosis, or individual improvement.

## Licence and data boundary

VISEM is licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
The source data and every derived model are research-only and cannot support a
commercial production feature.

The 35 GB archive is never downloaded in full. `fetch` verifies Zenodo record
`2640506`, DOI `10.5281/zenodo.2640506`, the archive's published MD5 and byte size,
then uses HTTP ranges to extract only:

- `participant_related_data.csv`
- `semen_analysis_data.csv`
- `sex_hormones.csv`

Raw participant files live in ignored `data/raw/`. Videos are never requested. Only
schemas, dataset-level metadata, synthetic fixtures, reports, and research artifacts
are committed.

## Reproduce

Install [uv](https://docs.astral.sh/uv/) and run from the repository root:

```bash
uv sync --project ml --frozen
uv run --project ml preseed-ml fetch
uv run --project ml preseed-ml validate
uv run --project ml preseed-ml regenerate
uv run --project ml pytest
uv run --project ml ruff check
```

Equivalent explicit lifecycle commands are `fetch`, `validate`, `train`, `evaluate`,
and `export`. Training, evaluation, and export intentionally regenerate the complete
reviewed result so no stale intermediate estimator can be exported.

`regenerate` performs repeated nested five-fold participant-level cross-validation
with fixed seeds, writes `reports/evaluation.json`, exports a versioned JSON linear
artifact when possible, and updates the model card. A clean reproduction must leave
those generated files unchanged.

## Model design

- Target: progressive motility percentage, trained with a bounded logit and reported
  back on the 0–100 scale.
- Core: age, BMI, abstinence duration.
- Extended: core plus serum total testosterone, estradiol, SHBG, FSH, and LH.
- Benchmarks: fold-specific mean, Ridge, Elastic Net, and a shallow decision tree.
- Selection: original-scale MAE; prefer Ridge when within 10% of the best benchmark.
- Gate: at least 10% MAE improvement over mean, positive median held-out R², and a
  framework-neutral linear export.
- Uncertainty: 80% empirical interval from repeated out-of-fold residuals; not a
  clinical confidence interval.

Median imputation and scaling are pipeline steps fitted only within each CV training
fold. All semen endpoints except the named target, all microscopy data, seminal-plasma
markers, fatty acids, and target-adjacent measurements are excluded from features.

If the gate fails, the result remains useful research but must not be exposed at
runtime. The deterministic readiness score is independent of this workspace.

## UCI Fertility screening experiment

The separate UCI experiment asks whether nine questionnaire-style inputs can
discriminate the dataset's historical normal/altered semen-quality label. It does not
change the VISEM result or the readiness score.

```bash
uv run --project ml preseed-ml uci-fetch
uv run --project ml preseed-ml uci-validate
uv run --project ml preseed-ml uci-regenerate
```

The fetch verifies the official UCI dataset 244 archive and its single allow-listed
member by SHA-256. Raw rows remain ignored. UCI Fertility is CC BY 4.0 and contains
100 participants with an 88-normal to 12-altered class split.

The evaluation compares:

- the 88%-accurate but zero-sensitivity all-normal baseline;
- weighted and fold-local oversampled logistic regression;
- a class-balanced shallow random forest;
- fold-local oversampled histogram gradient boosting;
- a class-weighted RBF support-vector machine; and
- fold-local oversampled Gaussian Naive Bayes.

Every candidate uses repeated nested stratified validation. Preprocessing, model
selection, resampling, sigmoid calibration, and operating-threshold selection stay
inside outer training data. The report includes raw and balanced accuracy,
sensitivity, specificity, precision, AUROC, PR-AUC reported as average precision,
Brier score, expected calibration error, bootstrap intervals, and fold distributions.

The selected calibrated shallow forest uses the altered-case prevalence calculated
from each outer training fold as a higher-sensitivity operating threshold. Its
exploratory point estimate is 0.665 balanced accuracy, 0.750 sensitivity, 0.580
specificity, 0.671 AUROC, and 0.265 PR-AUC. The original inner-optimized threshold
produced 0.606 balanced accuracy, 0.417 sensitivity, and 0.795 specificity.

This threshold improvement was designed after reviewing the initial result, and
balanced accuracy ranged from 0.583 to 0.665 across four complete seed runs. It is
not an untouched confirmation result. The requested 0.90 target still failed, so no
executable artifact or runtime feature is exported. See the
[UCI model card](models/UCI_MODEL_CARD.md) and
[machine-readable report](reports/uci-fertility-evaluation.json).

## Prospective repeated-test foundation

The next model must be trained on repeated standardized tests with preceding
longitudinal inputs, not by adding more algorithms to VISEM.

[`STUDY_PROTOCOL.md`](STUDY_PROTOCOL.md) freezes the initial research question,
outcomes, feature blocks, validation layers, and staged promotion rules.
[`schemas/prospective-cohort.schema.json`](schemas/prospective-cohort.schema.json)
defines the versioned input contract.

The feature builder:

- pairs every follow-up test with the participant's preceding test;
- creates separate targets for progressive motility, concentration, total count, and
  morphology;
- calculates 30-, 60-, and 90-day wearable/behaviour aggregates;
- accepts only observations and hormone measurements recorded before the target;
- retains participant, site, laboratory, time, and collection context;
- exposes incremental feature blocks rather than blindly fitting all variables; and
- provides participant-grouped, temporal, and site-holdout validation utilities.

Run the visibly synthetic contract demonstration with:

```bash
uv run --project ml preseed-ml validate-prospective
```

This command validates feature construction and the previous-result baseline. It does
not train, evaluate, promote, or export a model. Its four synthetic participants and
generated performance numbers are not evidence.
