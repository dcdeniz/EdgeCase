from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .config import MODEL_DIR, MODEL_VERSION, REPORT_DIR
from .uci_config import UCI_MANIFEST_PATH, UCI_MODEL_VERSION, UCI_REPORT_PATH

VISEM_EXPECTED = {
    "core": {
        "mae": (17.0665, 0.10),
        "rmse": (20.1411, 0.10),
        "spearman": (0.1492, 0.05),
        "r2": (-0.0082, 0.03),
    },
    "core+hormones": {
        "mae": (16.8135, 0.10),
        "rmse": (19.8821, 0.10),
        "spearman": (0.2834, 0.05),
        "r2": (0.0176, 0.03),
    },
}
UCI_EXPECTED = {
    "balancedAccuracy": (0.6648, 0.03),
    "sensitivity": (0.75, 0.10),
    "specificity": (0.5795, 0.06),
    "auroc": (0.6714, 0.03),
    "prAuc": (0.2652, 0.04),
    "brier": (0.1011, 0.02),
}


def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def _require_close(actual: Any, expected: float, tolerance: float, name: str) -> None:
    value = float(actual)
    if abs(value - expected) > tolerance:
        raise ValueError(
            f"{name} drifted outside its cross-platform tolerance: "
            f"{value} versus {expected} ± {tolerance}"
        )


def verify_generated_reports(
    *,
    report_dir: Path = REPORT_DIR,
    model_dir: Path = MODEL_DIR,
) -> dict[str, Any]:
    visem = _load(report_dir / "evaluation.json")
    visem_artifact = _load(
        model_dir / f"preseed-visem-progressive-motility.v{MODEL_VERSION}.json"
    )
    _require(visem["target"] == "progressiveMotilityPercent", "VISEM target changed")
    _require(visem["researchOnly"] is True, "VISEM research-only flag changed")
    _require(visem_artifact["researchOnly"] is True, "VISEM artifact safety flag changed")
    _require(
        all(model["eligibleForRuntime"] is False for model in visem_artifact["models"]),
        "A VISEM runtime model was exported without passing the reviewed gate",
    )
    for feature_set, expected_metrics in VISEM_EXPECTED.items():
        result = visem["featureSets"][feature_set]
        _require(result["promotionGate"]["passed"] is False, f"{feature_set} gate changed")
        _require(result["selectedForExport"] == "ridge", f"{feature_set} selection changed")
        metrics = result["models"][result["selectedForExport"]]["metrics"]
        for metric, (expected, tolerance) in expected_metrics.items():
            _require_close(
                metrics[metric],
                expected,
                tolerance,
                f"VISEM {feature_set} {metric}",
            )

    uci_path = UCI_REPORT_PATH if report_dir == REPORT_DIR else report_dir / UCI_REPORT_PATH.name
    manifest_path = (
        UCI_MANIFEST_PATH
        if model_dir == MODEL_DIR
        else model_dir / UCI_MANIFEST_PATH.name
    )
    uci = _load(uci_path)
    uci_manifest = _load(manifest_path)
    _require(uci["dataset"]["participantCount"] == 100, "UCI participant count changed")
    _require(uci["dataset"]["alteredCount"] == 12, "UCI altered count changed")
    _require(
        uci["validation"]["type"] == "RepeatedNestedStratifiedKFold",
        "UCI validation design changed",
    )
    _require(
        uci["selectedModel"] == "prevalence_threshold_forest",
        "UCI selected procedure changed",
    )
    _require(uci["runtimeEligible"] is False, "UCI runtime eligibility changed")
    _require(uci["ninetyPercentTarget"]["passed"] is False, "UCI 90% gate changed")
    _require(
        uci_manifest["semanticVersion"] == UCI_MODEL_VERSION,
        "UCI manifest version changed",
    )
    _require(
        uci_manifest["executableArtifactExported"] is False,
        "UCI executable artifact was exported",
    )
    uci_metrics = uci["models"][uci["selectedModel"]]["metrics"]
    for metric, (expected, tolerance) in UCI_EXPECTED.items():
        _require_close(uci_metrics[metric], expected, tolerance, f"UCI {metric}")

    return {
        "visemPromotionGatesPassed": False,
        "uciSelectedModel": uci["selectedModel"],
        "uciBalancedAccuracy": float(uci_metrics["balancedAccuracy"]),
        "uciRuntimeEligible": False,
        "crossPlatformMetricToleranceApplied": True,
    }
