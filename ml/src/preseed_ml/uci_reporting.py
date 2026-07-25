from __future__ import annotations

from pathlib import Path
from typing import Any

from .artifact import write_json
from .uci_config import (
    UCI_ARCHIVE_SHA256,
    UCI_ARCHIVE_URL,
    UCI_DOI,
    UCI_LICENCE,
    UCI_MANIFEST_PATH,
    UCI_MEMBER_NAME,
    UCI_MEMBER_SHA256,
    UCI_MODEL_CARD_PATH,
    UCI_MODEL_ID,
    UCI_MODEL_VERSION,
    UCI_REPORT_PATH,
    UCI_TRAINING_TIMESTAMP,
)


def build_uci_manifest(evaluation: dict[str, Any]) -> dict[str, Any]:
    selected_name = evaluation["selectedModel"]
    selected = evaluation["models"][selected_name]
    return {
        "modelId": UCI_MODEL_ID,
        "semanticVersion": UCI_MODEL_VERSION,
        "trainedAt": UCI_TRAINING_TIMESTAMP,
        "researchOnly": True,
        "runtimeEligible": False,
        "executableArtifactExported": False,
        "target": evaluation["target"],
        "dataset": {
            "name": "UCI Fertility",
            "uciDatasetId": 244,
            "doi": UCI_DOI,
            "licence": UCI_LICENCE,
            "archiveUrl": UCI_ARCHIVE_URL,
            "archiveSha256": UCI_ARCHIVE_SHA256,
            "member": UCI_MEMBER_NAME,
            "memberSha256": UCI_MEMBER_SHA256,
            **evaluation["dataset"],
        },
        "selectedModel": {
            "name": selected_name,
            "modalParameters": selected["modalParameters"],
            "resampling": selected["resampling"],
            "calibration": selected["calibration"],
            "thresholdSelection": selected["thresholdSelection"],
            "metrics": selected["metrics"],
            "bootstrap95": selected["bootstrap95"],
        },
        "validation": evaluation["validation"],
        "allNormalBaseline": evaluation["allNormalBaseline"],
        "adaptiveSecondPass": evaluation["adaptiveSecondPass"],
        "ninetyPercentTarget": evaluation["ninetyPercentTarget"],
        "intendedUse": (
            "Leakage-controlled hackathon research into whether nine UCI questionnaire "
            "variables can screen the dataset's historical normal/altered label."
        ),
        "prohibitedUse": [
            "Diagnosis or classification of an individual as fertile or infertile",
            "A fertility percentage, conception probability, or pregnancy probability",
            "Replacement for a standardized semen analysis",
            "Changing the deterministic readiness score",
            "Presenting the 88% raw-accuracy all-normal baseline as useful performance",
            "Presenting synthetic, training, or resampled performance as held-out evidence",
        ],
        "limitations": evaluation["runtimeBlockedReasons"],
        "compatibilityAudit": [
            {
                "dataset": "VISEM",
                "doi": "10.5281/zenodo.2640506",
                "licence": "CC BY-NC 4.0",
                "decision": (
                    "Do not row-pool with UCI: it has different features, continuous semen "
                    "endpoints, hormones, and no compatible normal/altered label contract."
                ),
            },
            {
                "dataset": "Spermiogram data n=308",
                "doi": "10.5281/zenodo.18762681",
                "licence": "CC BY 4.0",
                "decision": (
                    "Potential future separate-cohort study only. It has different predictors "
                    "and endpoints plus masked names, exact birth dates, and sensitive health "
                    "fields requiring privacy, ethics, provenance, and schema review."
                ),
            },
            {
                "dataset": "Advanced methods of evaluation of male ejaculate",
                "doi": "10.5281/zenodo.19337404",
                "licence": "CC0 1.0",
                "decision": (
                    "Do not use for lifestyle screening: its 107 rows contain semen and "
                    "post-processing measurements but no compatible pre-test lifestyle inputs."
                ),
            },
        ],
        "dataCollectionPlan": {
            "planningTargetsRequirePowerReview": True,
            "feasibilityCohort": (
                "At least 300 participants with at least 100 below-reference examples per "
                "pre-registered named endpoint, subject to formal power analysis."
            ),
            "externalValidation": (
                "At least 200 additional participants from two or more clinics held out in "
                "full, with laboratory and geography recorded."
            ),
            "repeatedTesting": (
                "Two standardized baseline semen analyses where feasible, 60-90 days of "
                "strictly preceding logs, and one follow-up analysis."
            ),
            "requiredInputs": [
                "age, BMI, waist and relevant clinical history",
                "medications, testosterone or anabolic exposure, fever and illness",
                "abstinence, completeness, transport, laboratory and analysis method",
                "sleep, activity, sedentary time, alcohol, nicotine, diet and heat windows",
                "site, device, provenance, missingness and consent metadata",
            ],
            "preRegisteredEndpoints": [
                "progressive motility percent",
                "sperm concentration million per mL",
                "total sperm count million",
                "normal morphology percent",
            ],
        },
        "exportDecision": (
            "No executable runtime artifact is exported because the dataset cannot "
            "support a validated individual screening feature. The manifest preserves "
            "the selected research procedure and held-out result."
        ),
    }


def write_uci_model_card(
    evaluation: dict[str, Any],
    manifest: dict[str, Any],
    path: Path = UCI_MODEL_CARD_PATH,
) -> None:
    selected = evaluation["models"][evaluation["selectedModel"]]
    metrics = selected["metrics"]
    baseline = evaluation["allNormalBaseline"]
    gate = evaluation["ninetyPercentTarget"]
    selected_calibration = metrics["expectedCalibrationError"]
    baseline_calibration = baseline["expectedCalibrationError"]
    seed_sensitivity = ", ".join(
        f'{item["balancedAccuracy"]:.3f} (seed {item["seed"]})'
        for item in evaluation["adaptiveSecondPass"]["selectedSeedSensitivity"]
    )
    content = f"""# UCI Fertility screening research card

- Model ID: `{UCI_MODEL_ID}`
- Version: `{UCI_MODEL_VERSION}`
- Status: research-only; runtime blocked
- Dataset: UCI Fertility, DOI `{UCI_DOI}`, {UCI_LICENCE}
- Participants: 100 (88 normal, 12 altered)
- Selected procedure: `{evaluation["selectedModel"]}`

## Intended question

Can nine questionnaire-style variables discriminate the UCI dataset's historical
normal/altered semen-quality label under repeated nested held-out validation?

This is not a fertility, conception, semen-count, motility, morphology, or diagnostic
model. It is completely separate from the deterministic readiness score.

## Validation

- Repeated nested stratified cross-validation:
  {evaluation["validation"]["outerSplits"]} outer folds ×
  {evaluation["validation"]["outerRepeats"]} repeats.
- Preprocessing, imbalance handling, calibration, hyperparameter selection, and
  threshold selection occur only inside training data.
- Probabilities use nested sigmoid calibration.
- The operating threshold is selected from inner out-of-fold predictions by balanced
  accuracy; outer test folds never tune it.

## Held-out result

| Metric | Selected model | Always-normal baseline |
| --- | ---: | ---: |
| Raw accuracy | {metrics["accuracy"]:.3f} | {baseline["accuracy"]:.3f} |
| Balanced accuracy | {metrics["balancedAccuracy"]:.3f} | {baseline["balancedAccuracy"]:.3f} |
| Sensitivity | {metrics["sensitivity"]:.3f} | {baseline["sensitivity"]:.3f} |
| Specificity | {metrics["specificity"]:.3f} | {baseline["specificity"]:.3f} |
| AUROC | {metrics["auroc"]:.3f} | {baseline["auroc"]:.3f} |
| PR-AUC (average precision) | {metrics["prAuc"]:.3f} | {baseline["prAuc"]:.3f} |
| Brier score | {metrics["brier"]:.3f} | {baseline["brier"]:.3f} |
| Calibration error | {selected_calibration:.3f} | {baseline_calibration:.3f} |

The requested 0.90 held-out balanced-accuracy target
{"passed" if gate["passed"] else "did not pass"}. Raw accuracy is not the target:
an all-normal classifier already achieves 0.88 while detecting zero altered cases.

## Adaptive second-pass disclosure

The selected procedure uses a threshold equal to the altered-case prevalence in each
outer training fold. This avoids fitting an unstable threshold to approximately nine
altered training examples. It increased sensitivity, but also increased false positives.

This operating point was designed after reviewing the initial cross-validation result,
so its performance is exploratory rather than an untouched confirmation estimate.
Balanced accuracy across additional complete seed runs was {seed_sensitivity}.
The variation is material and reinforces the runtime block.

Methods screened but not retained:
{chr(10).join(f'- {item}' for item in evaluation["adaptiveSecondPass"]["screenedButNotRetained"])}

## Export decision

{manifest["exportDecision"]}

## Limitations

{chr(10).join(f"- {item}" for item in manifest["limitations"])}

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
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def write_uci_outputs(evaluation: dict[str, Any]) -> dict[str, Any]:
    manifest = build_uci_manifest(evaluation)
    write_json(evaluation, UCI_REPORT_PATH)
    write_json(manifest, UCI_MANIFEST_PATH)
    write_uci_model_card(evaluation, manifest, UCI_MODEL_CARD_PATH)
    return manifest
