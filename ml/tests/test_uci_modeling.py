from __future__ import annotations

from test_uci_dataset import synthetic_uci_frame

from preseed_ml.uci_modeling import (
    CATEGORICAL_FEATURES,
    CONTINUOUS_FEATURES,
    evaluate_uci_fertility,
    uci_candidates,
)
from preseed_ml.uci_reporting import build_uci_manifest


def test_resampling_and_preprocessing_are_inside_training_pipeline() -> None:
    candidates = uci_candidates(seed=7)
    oversampled = next(item for item in candidates if item.name == "oversampled_logistic")
    prevalence = next(
        item for item in candidates if item.name == "prevalence_threshold_forest"
    )
    steps = [name for name, _ in oversampled.estimator.steps]
    assert steps == ["preprocess", "resample", "model"]
    assert prevalence.threshold_strategy == "training_fold_prevalence"
    assert "diagnosis" not in CONTINUOUS_FEATURES + CATEGORICAL_FEATURES


def test_small_nested_evaluation_is_deterministic_and_preserves_negative_gate() -> None:
    frame = synthetic_uci_frame()
    candidate = [uci_candidates(seed=11)[0]]
    kwargs = {
        "outer_splits": 3,
        "outer_repeats": 1,
        "inner_splits": 2,
        "calibration_splits": 2,
        "bootstrap_iterations": 30,
        "seed": 11,
        "candidates": candidate,
    }
    first = evaluate_uci_fertility(frame, **kwargs)
    second = evaluate_uci_fertility(frame, **kwargs)
    assert first == second
    assert first["allNormalBaseline"]["accuracy"] == 0.88
    assert first["allNormalBaseline"]["balancedAccuracy"] == 0.5
    assert first["allNormalBaseline"]["sensitivity"] == 0.0
    assert first["validation"]["thresholdTuningInsideTrainingFolds"] is True
    assert first["adaptiveSecondPass"]["confirmatoryPerformanceAvailable"] is False
    assert len(first["models"]["weighted_logistic"]["participantPredictions"]) == 100

    manifest = build_uci_manifest(first)
    assert manifest["runtimeEligible"] is False
    assert manifest["executableArtifactExported"] is False
    assert manifest["ninetyPercentTarget"] == first["ninetyPercentTarget"]
