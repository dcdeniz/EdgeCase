# Prospective repeated-test model protocol

- Status: pre-registration draft; requires biostatistical and clinical review
- Version: 0.1.0
- Date: 2026-07-25
- Runtime status: prohibited until all promotion stages pass

## Research question

Among adult men with a previous standardized semen analysis, can clinical context and
pre-sample longitudinal behaviour data improve prediction of the next progressive
motility percentage beyond simply carrying forward the previous result?

This is an endpoint forecast, not a fertility, conception, pregnancy, diagnosis, or
treatment model.

## Cohort and timing

Recruit across multiple clinics and laboratories. Each participant needs at least two
semen tests; three or more are preferred for within-person research. Collection and
analysis should follow the WHO laboratory manual wherever possible.

For every target test:

- the preceding test supplies the clinical anchor;
- daily features are computed strictly before the target day;
- hormone results must have been available before the target collection time;
- 90 days is the primary longitudinal window;
- 30- and 60-day windows are exploratory sensitivity analyses; and
- participant, site, laboratory, time, collection completeness, abstinence, transport,
  fever, and method provenance are retained.

The source contract is
[`schemas/prospective-cohort.schema.json`](schemas/prospective-cohort.schema.json).
No directly identifying information belongs in the ML workspace.

## Outcomes

Primary:

- progressive motility percentage as a continuous outcome.

Secondary, evaluated as independent continuous endpoints:

- sperm concentration, million/mL;
- total sperm count, million; and
- normal morphology percentage.

Total motile sperm count and DNA fragmentation require separately versioned definitions
and sufficient measurements before addition. No generic `fertile` label is permitted.

## Feature blocks

Compare incrementally:

1. previous test only;
2. previous test plus collection conditions;
3. previous test, collection conditions, clinical context, and hormones; and
4. the preceding block plus primary 90-day behaviour aggregates.

The multiscale 30/60/90-day block is exploratory and cannot win merely because it
contains more variables. Candidate predictors and transformations must be frozen before
the first outcome-bearing development extract is inspected.

Exogenous testosterone and anabolic-steroid indicators are safety/context variables,
not ordinary lifestyle deductions. They must never cause treatment advice.

## Benchmarks

Required comparisons:

- population mean;
- previous result carried forward;
- Ridge;
- Elastic Net;
- a generalized additive or spline-based regression;
- a repeated-measure model using participant and site/laboratory structure when the
  number of repeated observations and clusters is sufficient; and
- shallow histogram gradient boosting.

The code currently provides the previous-result baseline, Ridge, and histogram-gradient
boosting scaffolds. Repeated-measure modelling must be specified with a biostatistician
after the final cluster structure and estimand are known; it must not be improvised on
the four-person synthetic fixture.

## Validation

Use all of the following:

1. nested participant-grouped cross-validation for model development;
2. a chronological holdout;
3. an untouched clinic/laboratory holdout;
4. subgroup reporting specified before evaluation; and
5. frozen prospective silent validation on newly collected participants.

Preprocessing, imputation, scaling, feature selection, transformation, and tuning occur
inside each training fold. Target-test semen measurements, future observations,
post-result decisions, and target-derived microscopy features are prohibited predictors.

## Metrics

For each endpoint and feature block report:

- MAE and RMSE in the endpoint's original units;
- R² and Spearman correlation;
- calibration intercept and slope;
- 80% and 95% research-interval coverage and width;
- fold, site, temporal, and subgroup distributions;
- missingness and out-of-distribution rates; and
- paired performance difference from the previous-result baseline with uncertainty.

## Sample size

Do not use a fixed subjects-per-variable rule. Before recruitment is finalized, use a
continuous-outcome prediction-model sample-size calculation based on:

- the frozen number of candidate parameters;
- pilot outcome mean and variance;
- conservatively anticipated model R²;
- acceptable shrinkage/overfitting; and
- desired precision for external-validation metrics.

The calculation, assumptions, software version, and resulting development and external
validation targets must be committed as a protocol amendment. The synthetic fixture is
not a pilot and supplies no sample-size or accuracy evidence.

## Promotion stages

### Development research gate

- at least 10% lower participant-held-out MAE than carrying forward the previous result;
- positive median held-out R²;
- uncertainty intervals reported;
- no material subgroup or missingness failure; and
- complete reproducibility from a frozen extract.

### External validation gate

- benefit over the previous-result baseline reproduced at an untouched site;
- calibration and interval coverage acceptable under predeclared tolerances;
- errors and eligibility reviewed by clinical and statistical reviewers; and
- source licence permits the intended use.

### Runtime gate

- frozen prospective silent validation passes;
- assessment, privacy, security, audit, and regulatory reviews are complete;
- the Hono assessment/API foundation and append-only model-version audit exist; and
- the estimate remains separate from readiness scoring, recommendations, clinical
  gates, and measured values.

Failure at any stage blocks runtime exposure. Thresholds beyond the existing 10% MAE
and positive-R² research gate require clinical and biostatistical agreement before data
are inspected.
