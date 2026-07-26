from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from imblearn.over_sampling import RandomOverSampler
from imblearn.pipeline import Pipeline
from numpy.typing import NDArray
from sklearn.base import clone
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    confusion_matrix,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    GridSearchCV,
    RepeatedStratifiedKFold,
    StratifiedKFold,
    cross_val_predict,
)
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC

from .uci_config import (
    UCI_BOOTSTRAP_ITERATIONS,
    UCI_CALIBRATION_SPLITS,
    UCI_INNER_SPLITS,
    UCI_OUTER_REPEATS,
    UCI_OUTER_SPLITS,
    UCI_RANDOM_SEED,
)
from .uci_dataset import uci_feature_target


@dataclass(frozen=True)
class UciCandidate:
    name: str
    estimator: Any
    parameters: dict[str, list[Any]]
    resampling: str
    interpretable: bool
    threshold_strategy: str = "inner_balanced_accuracy"


CONTINUOUS_FEATURES = ["season", "age_normalized", "alcohol_frequency", "sitting_normalized"]
CATEGORICAL_FEATURES = [
    "childhood_diseases",
    "trauma",
    "surgery",
    "recent_fever",
    "smoking",
]


def _preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        [
            ("continuous", StandardScaler(), CONTINUOUS_FEATURES),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
    )


def _calibrated(
    pipeline: Pipeline,
    *,
    seed: int,
    calibration_splits: int,
) -> CalibratedClassifierCV:
    calibration = StratifiedKFold(
        n_splits=calibration_splits,
        shuffle=True,
        random_state=seed,
    )
    return CalibratedClassifierCV(
        estimator=pipeline,
        method="sigmoid",
        cv=calibration,
        ensemble=True,
    )


def uci_candidates(
    *,
    seed: int = UCI_RANDOM_SEED,
) -> list[UciCandidate]:
    logistic_weighted = Pipeline(
        [
            ("preprocess", _preprocessor()),
            (
                "model",
                LogisticRegression(
                    class_weight="balanced",
                    max_iter=10_000,
                    random_state=seed,
                ),
            ),
        ]
    )
    logistic_resampled = Pipeline(
        [
            ("preprocess", _preprocessor()),
            ("resample", RandomOverSampler(random_state=seed)),
            ("model", LogisticRegression(max_iter=10_000, random_state=seed)),
        ]
    )
    forest = Pipeline(
        [
            ("preprocess", _preprocessor()),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=100,
                    class_weight="balanced_subsample",
                    random_state=seed,
                    n_jobs=1,
                ),
            ),
        ]
    )
    boosted = Pipeline(
        [
            ("preprocess", _preprocessor()),
            ("resample", RandomOverSampler(random_state=seed)),
            (
                "model",
                HistGradientBoostingClassifier(
                    max_iter=100,
                    l2_regularization=5.0,
                    random_state=seed,
                ),
            ),
        ]
    )
    svm = Pipeline(
        [
            ("preprocess", _preprocessor()),
            (
                "model",
                SVC(
                    kernel="rbf",
                    class_weight="balanced",
                    random_state=seed,
                ),
            ),
        ]
    )
    naive_bayes = Pipeline(
        [
            ("preprocess", _preprocessor()),
            ("resample", RandomOverSampler(random_state=seed)),
            ("model", GaussianNB()),
        ]
    )
    return [
        UciCandidate(
            "weighted_logistic",
            logistic_weighted,
            {"model__C": [0.01, 0.1, 1.0, 10.0]},
            "class_weight_balanced",
            True,
        ),
        UciCandidate(
            "oversampled_logistic",
            logistic_resampled,
            {"model__C": [0.01, 0.1, 1.0, 10.0]},
            "random_oversampling_inside_training_folds",
            True,
        ),
        UciCandidate(
            "balanced_shallow_forest",
            forest,
            {
                "model__max_depth": [2, 4],
                "model__min_samples_leaf": [4, 8],
                "model__max_features": ["sqrt"],
            },
            "class_weight_balanced_subsample",
            True,
        ),
        UciCandidate(
            "oversampled_hist_gradient_boosting",
            boosted,
            {
                "model__max_leaf_nodes": [3, 7],
                "model__learning_rate": [0.05, 0.1],
                "model__min_samples_leaf": [5, 10],
            },
            "random_oversampling_inside_training_folds",
            False,
        ),
        UciCandidate(
            "weighted_rbf_svm",
            svm,
            {
                "model__C": [0.1, 1.0, 10.0, 100.0],
                "model__gamma": ["scale", 0.1, 1.0],
            },
            "class_weight_balanced",
            False,
        ),
        UciCandidate(
            "oversampled_gaussian_naive_bayes",
            naive_bayes,
            {
                "model__var_smoothing": [1e-11, 1e-9, 1e-7],
            },
            "random_oversampling_inside_training_folds",
            True,
        ),
        UciCandidate(
            "prevalence_threshold_forest",
            forest,
            {
                "model__max_depth": [2, 4],
                "model__min_samples_leaf": [4, 8],
                "model__max_features": ["sqrt"],
            },
            "class_weight_balanced_subsample",
            True,
            "training_fold_prevalence",
        ),
        UciCandidate(
            "prevalence_threshold_hist_boosting",
            boosted,
            {
                "model__max_leaf_nodes": [3, 7],
                "model__learning_rate": [0.05, 0.1],
                "model__min_samples_leaf": [5, 10],
            },
            "random_oversampling_inside_training_folds",
            False,
            "training_fold_prevalence",
        ),
    ]


def _expected_calibration_error(
    actual: NDArray[np.int_],
    probability: NDArray[np.float64],
    bins: int = 10,
) -> float:
    edges = np.linspace(0.0, 1.0, bins + 1)
    total = len(actual)
    value = 0.0
    for index in range(bins):
        if index == bins - 1:
            mask = (probability >= edges[index]) & (probability <= edges[index + 1])
        else:
            mask = (probability >= edges[index]) & (probability < edges[index + 1])
        if not np.any(mask):
            continue
        value += float(np.sum(mask) / total) * abs(
            float(np.mean(actual[mask])) - float(np.mean(probability[mask]))
        )
    return value


def classification_metrics(
    actual: NDArray[np.int_],
    probability: NDArray[np.float64],
    predicted: NDArray[np.int_],
) -> dict[str, float]:
    matrix = confusion_matrix(actual, predicted, labels=[0, 1])
    true_negative, false_positive, false_negative, true_positive = matrix.ravel()
    specificity = (
        0.0
        if true_negative + false_positive == 0
        else true_negative / (true_negative + false_positive)
    )
    return {
        "accuracy": float(accuracy_score(actual, predicted)),
        "balancedAccuracy": float(balanced_accuracy_score(actual, predicted)),
        "sensitivity": float(recall_score(actual, predicted, zero_division=0)),
        "specificity": float(specificity),
        "precision": float(precision_score(actual, predicted, zero_division=0)),
        "auroc": float(roc_auc_score(actual, probability)),
        "prAuc": float(average_precision_score(actual, probability)),
        "brier": float(brier_score_loss(actual, probability)),
        "expectedCalibrationError": float(_expected_calibration_error(actual, probability)),
        "trueNegative": float(true_negative),
        "falsePositive": float(false_positive),
        "falseNegative": float(false_negative),
        "truePositive": float(true_positive),
    }


def _select_threshold(
    actual: NDArray[np.int_],
    probability: NDArray[np.float64],
) -> float:
    thresholds = np.linspace(0.05, 0.95, 181)
    scored = [
        (
            float(balanced_accuracy_score(actual, (probability >= threshold).astype(int))),
            -abs(float(threshold) - 0.5),
            float(threshold),
        )
        for threshold in thresholds
    ]
    return max(scored)[2]


def _bootstrap_intervals(
    actual: NDArray[np.int_],
    probability: NDArray[np.float64],
    predicted: NDArray[np.int_],
    *,
    iterations: int,
    seed: int,
) -> dict[str, list[float]]:
    rng = np.random.default_rng(seed)
    keys = [
        "accuracy",
        "balancedAccuracy",
        "sensitivity",
        "specificity",
        "precision",
        "auroc",
        "prAuc",
        "brier",
        "expectedCalibrationError",
    ]
    values: dict[str, list[float]] = {key: [] for key in keys}
    for _ in range(iterations):
        indices = rng.integers(0, len(actual), len(actual))
        if len(np.unique(actual[indices])) < 2:
            continue
        metrics = classification_metrics(
            actual[indices],
            probability[indices],
            predicted[indices],
        )
        for key in keys:
            if np.isfinite(metrics[key]):
                values[key].append(metrics[key])
    return {
        key: [
            float(np.quantile(metric_values, 0.025)),
            float(np.quantile(metric_values, 0.975)),
        ]
        for key, metric_values in values.items()
    }


def _distribution(
    folds: list[dict[str, float]],
    key: str,
) -> dict[str, Any]:
    values = [float(fold[key]) for fold in folds]
    return {
        "median": float(np.median(values)),
        "q1": float(np.quantile(values, 0.25)),
        "q3": float(np.quantile(values, 0.75)),
        "values": values,
    }


def _evaluate_candidate(
    features: pd.DataFrame,
    target: pd.Series,
    candidate: UciCandidate,
    *,
    outer_splits: int,
    outer_repeats: int,
    inner_splits: int,
    calibration_splits: int,
    bootstrap_iterations: int,
    seed: int,
) -> dict[str, Any]:
    actual_all = target.to_numpy(dtype=int)
    outer = RepeatedStratifiedKFold(
        n_splits=outer_splits,
        n_repeats=outer_repeats,
        random_state=seed,
    )
    predictions: list[dict[str, Any]] = []
    fold_metrics: list[dict[str, float]] = []
    chosen_parameters: list[dict[str, Any]] = []
    thresholds: list[float] = []

    for fold_number, (train_indices, test_indices) in enumerate(
        outer.split(features, actual_all),
        start=1,
    ):
        inner = StratifiedKFold(
            n_splits=inner_splits,
            shuffle=True,
            random_state=seed + fold_number,
        )
        search = GridSearchCV(
            clone(candidate.estimator),
            candidate.parameters,
            scoring="balanced_accuracy",
            cv=inner,
            refit=True,
            n_jobs=1,
            error_score="raise",
        )
        train_features = features.iloc[train_indices]
        train_target = actual_all[train_indices]
        search.fit(train_features, train_target)

        calibrated = _calibrated(
            clone(search.best_estimator_),
            seed=seed + 10_000 + fold_number,
            calibration_splits=calibration_splits,
        )
        if candidate.threshold_strategy == "training_fold_prevalence":
            threshold = float(np.mean(train_target))
        else:
            threshold_probabilities = cross_val_predict(
                clone(calibrated),
                train_features,
                train_target,
                cv=inner,
                method="predict_proba",
                n_jobs=1,
            )[:, 1]
            threshold = _select_threshold(train_target, threshold_probabilities)
        calibrated.fit(train_features, train_target)
        probability = calibrated.predict_proba(features.iloc[test_indices])[:, 1]
        predicted = (probability >= threshold).astype(int)
        actual = actual_all[test_indices]
        fold_metrics.append(classification_metrics(actual, probability, predicted))
        chosen_parameters.append(search.best_params_)
        thresholds.append(threshold)
        repeat = (fold_number - 1) // outer_splits
        for row, observed, chance, label in zip(
            test_indices,
            actual,
            probability,
            predicted,
            strict=True,
        ):
            predictions.append(
                {
                    "repeat": repeat,
                    "row": int(row),
                    "actual": int(observed),
                    "probabilityAltered": float(chance),
                    "predictedAltered": int(label),
                    "threshold": float(threshold),
                }
            )

    prediction_frame = pd.DataFrame(predictions)
    aggregate = prediction_frame.groupby("row", sort=True).agg(
        actual=("actual", "first"),
        probabilityAltered=("probabilityAltered", "mean"),
        predictedVote=("predictedAltered", "mean"),
    )
    actual = aggregate["actual"].to_numpy(dtype=int)
    probability = aggregate["probabilityAltered"].to_numpy(dtype=float)
    predicted = (aggregate["predictedVote"].to_numpy(dtype=float) >= 0.5).astype(int)
    metrics = classification_metrics(actual, probability, predicted)
    parameter_counts = Counter(
        tuple(sorted(parameters.items())) for parameters in chosen_parameters
    )
    modal_parameters = dict(parameter_counts.most_common(1)[0][0])
    fold_distribution = {
        key: _distribution(fold_metrics, key)
        for key in (
            "accuracy",
            "balancedAccuracy",
            "sensitivity",
            "specificity",
            "precision",
            "auroc",
            "prAuc",
            "brier",
            "expectedCalibrationError",
        )
    }
    return {
        "model": candidate.name,
        "interpretable": candidate.interpretable,
        "resampling": candidate.resampling,
        "calibration": "nested training-fold sigmoid calibration",
        "thresholdSelection": (
            "outer-training-fold altered prevalence; no threshold optimization"
            if candidate.threshold_strategy == "training_fold_prevalence"
            else "inner out-of-fold balanced-accuracy optimization"
        ),
        "metrics": metrics,
        "bootstrap95": _bootstrap_intervals(
            actual,
            probability,
            predicted,
            iterations=bootstrap_iterations,
            seed=seed + len(candidate.name),
        ),
        "foldDistribution": fold_distribution,
        "thresholdDistribution": {
            "median": float(np.median(thresholds)),
            "q1": float(np.quantile(thresholds, 0.25)),
            "q3": float(np.quantile(thresholds, 0.75)),
            "values": [float(value) for value in thresholds],
        },
        "modalParameters": modal_parameters,
        "participantPredictions": [
            {
                "row": int(row),
                "actual": int(values["actual"]),
                "probabilityAltered": float(values["probabilityAltered"]),
                "predictedAltered": int(values["predictedVote"] >= 0.5),
            }
            for row, values in aggregate.iterrows()
        ],
    }


def evaluate_uci_fertility(
    frame: pd.DataFrame,
    *,
    outer_splits: int = UCI_OUTER_SPLITS,
    outer_repeats: int = UCI_OUTER_REPEATS,
    inner_splits: int = UCI_INNER_SPLITS,
    calibration_splits: int = UCI_CALIBRATION_SPLITS,
    bootstrap_iterations: int = UCI_BOOTSTRAP_ITERATIONS,
    seed: int = UCI_RANDOM_SEED,
    candidates: list[UciCandidate] | None = None,
) -> dict[str, Any]:
    features, target = uci_feature_target(frame)
    evaluated_candidates = candidates or uci_candidates(seed=seed)
    models = {
        candidate.name: _evaluate_candidate(
            features,
            target,
            candidate,
            outer_splits=outer_splits,
            outer_repeats=outer_repeats,
            inner_splits=inner_splits,
            calibration_splits=calibration_splits,
            bootstrap_iterations=bootstrap_iterations,
            seed=seed,
        )
        for candidate in evaluated_candidates
    }
    selected = max(
        models,
        key=lambda name: (
            models[name]["metrics"]["balancedAccuracy"],
            models[name]["metrics"]["auroc"],
            -models[name]["metrics"]["brier"],
        ),
    )
    all_normal_probability = np.zeros(len(target), dtype=float)
    all_normal_prediction = np.zeros(len(target), dtype=int)
    baseline = classification_metrics(
        target.to_numpy(dtype=int),
        all_normal_probability,
        all_normal_prediction,
    )
    selected_report = models[selected]
    target_gate = {
        "targetBalancedAccuracy": 0.90,
        "pointEstimateReached": bool(
            selected_report["metrics"]["balancedAccuracy"] >= 0.90
        ),
        "medianFoldReached": bool(
            selected_report["foldDistribution"]["balancedAccuracy"]["median"] >= 0.90
        ),
        "passed": bool(
            selected_report["metrics"]["balancedAccuracy"] >= 0.90
            and selected_report["foldDistribution"]["balancedAccuracy"]["median"] >= 0.90
        ),
    }
    return {
        "schemaVersion": 1,
        "dataset": {
            "participantCount": int(len(frame)),
            "normalCount": int((target == 0).sum()),
            "alteredCount": int((target == 1).sum()),
            "participantIdentifierAvailable": False,
        },
        "target": {
            "name": "uciNormalAlteredSemenQuality",
            "positiveClass": "altered",
            "diagnosticUsePermitted": False,
        },
        "metricDefinitions": {
            "prAuc": (
                "Average precision from the held-out precision-recall curve "
                "(sklearn average_precision_score)."
            ),
            "brier": "Mean squared error of the held-out altered-class probabilities.",
            "expectedCalibrationError": (
                "Ten equal-width probability bins, weighted by participant count."
            ),
        },
        "validation": {
            "type": "RepeatedNestedStratifiedKFold",
            "outerSplits": outer_splits,
            "outerRepeats": outer_repeats,
            "innerSplits": inner_splits,
            "calibrationSplits": calibration_splits,
            "preprocessingInsideTrainingFolds": True,
            "resamplingInsideTrainingFolds": True,
            "thresholdTuningInsideTrainingFolds": True,
            "seed": seed,
        },
        "allNormalBaseline": baseline,
        "models": models,
        "selectedModel": selected,
        "selectionRule": (
            "Highest aggregate held-out balanced accuracy, then AUROC, then lower Brier score."
        ),
        "adaptiveSecondPass": {
            "exploratory": True,
            "confirmatoryPerformanceAvailable": False,
            "change": (
                "After the initial evaluation, two training-fold-prevalence operating "
                "points were added to reduce unstable threshold fitting with only 12 "
                "altered cases."
            ),
            "screenedButNotRetained": [
                "balanced random forest",
                "balanced extremely randomized trees",
                "fold-local univariate feature selection plus logistic regression",
                "regularized soft-voting ensemble",
                "season-as-nominal balanced forest",
                "shrinkage linear discriminant analysis",
                "regularized quadratic discriminant analysis",
                "distance-weighted nearest neighbors",
            ],
            "selectedSeedSensitivity": [
                {"seed": 7, "balancedAccuracy": 0.642},
                {"seed": 42, "balancedAccuracy": 0.636},
                {"seed": 2026, "balancedAccuracy": 0.583},
                {"seed": UCI_RANDOM_SEED, "balancedAccuracy": 0.665},
            ],
            "interpretation": (
                "The higher-sensitivity operating point is useful for hackathon research, "
                "but its balanced-accuracy gain is seed-sensitive and is not an untouched "
                "confirmation result."
            ),
        },
        "ninetyPercentTarget": target_gate,
        "runtimeEligible": False,
        "runtimeBlockedReasons": [
            "Only 100 participants and 12 altered labels",
            "No participant identifiers to audit duplicates or repeated measures",
            "No external, temporal, clinic, geographic, or prospective validation",
            "The target is a coarse historical normal/altered label, not a named semen endpoint",
            "The improved operating point was developed adaptively after reviewing the initial CV",
        ],
    }
