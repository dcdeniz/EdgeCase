from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from .config import (
    ARCHIVE_MD5,
    ARCHIVE_SIZE,
    BOOTSTRAP_ITERATIONS,
    FEATURES,
    LICENCE,
    MODEL_ID,
    MODEL_VERSION,
    RANDOM_SEED,
    TARGET_COLUMN,
    TRAINING_TIMESTAMP,
    ZENODO_DOI,
    ZENODO_RECORD_ID,
)
from .dataset import feature_frame
from .modeling import fit_export_pipeline


def _serialise_linear_pipeline(
    pipeline: Pipeline,
    joined: pd.DataFrame,
    feature_set: str,
    report: dict[str, Any],
) -> dict[str, Any]:
    x = feature_frame(joined, feature_set)
    imputer = pipeline.named_steps["imputer"]
    scaler = pipeline.named_steps["scaler"]
    model = pipeline.named_steps["model"]
    participant_predictions = report["models"][report["selectedForExport"]][
        "participantPredictions"
    ]
    residuals = np.asarray(
        [row["actualPercent"] - row["predictedPercent"] for row in participant_predictions]
    )
    residual_half_width = float(np.quantile(np.abs(residuals), 0.80))
    definitions = FEATURES[feature_set]
    return {
        "featureSet": feature_set,
        "eligibleForRuntime": bool(report["promotionGate"]["passed"]),
        "orderedFeatures": [
            {
                "name": public_name,
                "sourceColumn": source,
                "unit": unit,
                "trainingRange": {
                    "min": float(x[public_name].min()),
                    "max": float(x[public_name].max()),
                },
            }
            for public_name, (source, unit) in definitions.items()
        ],
        "preprocessing": {
            "imputation": {
                "strategy": "median",
                "values": [float(value) for value in imputer.statistics_],
            },
            "scaling": {
                "mean": [float(value) for value in scaler.mean_],
                "scale": [float(value) for value in scaler.scale_],
            },
        },
        "linearModel": {
            "kind": report["selectedForExport"],
            "coefficients": [float(value) for value in model.coef_],
            "intercept": float(model.intercept_),
        },
        "inverseTransformation": {
            "formula": "clip(101 * sigmoid(linearPrediction) - 0.5, 0, 100)",
            "boundsPercent": [0, 100],
        },
        "researchInterval80": {
            "method": (
                "symmetric absolute 80th percentile of participant-level "
                "repeated OOF residuals"
            ),
            "halfWidthPercentagePoints": residual_half_width,
            "clinicalConfidenceInterval": False,
        },
        "outOfDistributionPolicy": (
            "Ineligible when any required value is outside its inclusive training range; "
            "do not coerce or extrapolate."
        ),
        "evaluation": {
            "selectedModel": report["selectedForExport"],
            "benchmarkWinner": report["benchmarkWinner"],
            "metrics": report["models"][report["selectedForExport"]]["metrics"],
            "bootstrap95": report["models"][report["selectedForExport"]]["bootstrap95"],
            "promotionGate": report["promotionGate"],
        },
    }


def build_artifact(joined: pd.DataFrame, reports: dict[str, dict[str, Any]]) -> dict[str, Any]:
    models = []
    for feature_set in ("core", "core+hormones"):
        report = reports[feature_set]
        if report["selectedForExport"] not in {"ridge", "elastic_net"}:
            models.append(
                {
                    "featureSet": feature_set,
                    "eligibleForRuntime": False,
                    "exportBlockedReason": "Best permitted selection is not a linear JSON model.",
                    "evaluation": report,
                }
            )
            continue
        pipeline = fit_export_pipeline(joined, feature_set, report)
        models.append(_serialise_linear_pipeline(pipeline, joined, feature_set, report))

    return {
        "$schema": "../schemas/model-artifact.schema.json",
        "modelId": MODEL_ID,
        "semanticVersion": MODEL_VERSION,
        "trainedAt": TRAINING_TIMESTAMP,
        "researchOnly": True,
        "commercialUsePermitted": False,
        "target": {
            "name": "progressiveMotilityPercent",
            "sourceColumn": TARGET_COLUMN,
            "unit": "percent",
            "transformation": {
                "name": "bounded_logit",
                "formula": "log(((y + 0.5) / 101) / (1 - ((y + 0.5) / 101)))",
            },
        },
        "dataset": {
            "name": "VISEM: A Multimodal Video Dataset of Human Spermatozoa",
            "zenodoRecordId": ZENODO_RECORD_ID,
            "doi": ZENODO_DOI,
            "archiveMd5": ARCHIVE_MD5,
            "archiveBytes": ARCHIVE_SIZE,
            "licence": LICENCE,
            "attribution": (
                "Haugen TB, Hicks SA, Andersen JM, Witczak O, Hammer HL, Borgli R, "
                "Halvorsen P, Riegler M. VISEM."
            ),
            "participantCount": int(len(joined)),
        },
        "training": {
            "python": "3.12",
            "deterministicSeed": RANDOM_SEED,
            "bootstrapIterations": BOOTSTRAP_ITERATIONS,
            "rawParticipantDataCommitted": False,
        },
        "models": models,
        "intendedUse": (
            "Hackathon and non-commercial research into a progressive-motility estimate "
            "for adults matching the VISEM feature ranges."
        ),
        "prohibitedUse": [
            "Diagnosis or classification as fertile or infertile",
            "Conception, pregnancy, or live-birth probability",
            "Clinical decision-making or treatment selection",
            "Commercial use under the source dataset licence",
            "Claiming that behaviour change improved semen quality without a follow-up test",
        ],
        "limitations": [
            "Only 85 participants from one small research dataset",
            "No external, geographic, temporal, site, or prospective validation",
            "No wearable, diet, product, or environmental longitudinal inputs",
            "The residual interval is empirical research uncertainty, not a clinical interval",
            "Predictions do not replace a standardized semen analysis",
        ],
    }


def write_json(payload: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, indent=2, sort_keys=False, allow_nan=False) + "\n",
        encoding="utf-8",
    )
