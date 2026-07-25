from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from numpy.typing import NDArray
from sklearn.base import clone
from sklearn.impute import SimpleImputer
from sklearn.linear_model import ElasticNet, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, KFold, RepeatedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeRegressor

from .config import (
    BOOTSTRAP_ITERATIONS,
    INNER_SPLITS,
    OUTER_REPEATS,
    OUTER_SPLITS,
    RANDOM_SEED,
    TARGET_COLUMN,
)
from .dataset import feature_frame
from .transform import bounded_logit, inverse_bounded_logit


@dataclass(frozen=True)
class Candidate:
    name: str
    estimator: Any
    parameters: dict[str, list[Any]]


def _mae_original_scale(estimator: Any, x: pd.DataFrame, y: NDArray[np.float64]) -> float:
    prediction = inverse_bounded_logit(estimator.predict(x))
    return -float(mean_absolute_error(inverse_bounded_logit(y), prediction))


def candidate_models(seed: int = RANDOM_SEED) -> list[Candidate]:
    scaled = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("model", Ridge()),
        ]
    )
    elastic = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            (
                "model",
                ElasticNet(max_iter=50_000, selection="cyclic", random_state=seed),
            ),
        ]
    )
    tree = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("model", DecisionTreeRegressor(random_state=seed)),
        ]
    )
    return [
        Candidate("ridge", scaled, {"model__alpha": [0.01, 0.1, 1.0, 10.0, 100.0]}),
        Candidate(
            "elastic_net",
            elastic,
            {
                "model__alpha": [0.01, 0.1, 1.0],
                "model__l1_ratio": [0.1, 0.5, 0.9],
            },
        ),
        Candidate(
            "shallow_tree",
            tree,
            {"model__max_depth": [2, 3], "model__min_samples_leaf": [4, 8]},
        ),
    ]


def _metrics(actual: NDArray[np.float64], predicted: NDArray[np.float64]) -> dict[str, float]:
    spearman = (
        0.0
        if np.ptp(actual) == 0 or np.ptp(predicted) == 0
        else float(pd.Series(actual).corr(pd.Series(predicted), method="spearman"))
    )
    return {
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(mean_squared_error(actual, predicted) ** 0.5),
        "spearman": spearman,
        "r2": float(r2_score(actual, predicted)),
    }


def _bootstrap_intervals(
    actual: NDArray[np.float64],
    predicted: NDArray[np.float64],
    *,
    iterations: int,
    seed: int,
) -> dict[str, list[float]]:
    rng = np.random.default_rng(seed)
    values = {key: [] for key in ("mae", "rmse", "spearman", "r2")}
    for _ in range(iterations):
        indices = rng.integers(0, len(actual), len(actual))
        if len(np.unique(actual[indices])) < 2 or len(np.unique(predicted[indices])) < 2:
            continue
        sample = _metrics(actual[indices], predicted[indices])
        for key, value in sample.items():
            if np.isfinite(value):
                values[key].append(value)
    return {
        key: [
            float(np.quantile(metric_values, 0.025)),
            float(np.quantile(metric_values, 0.975)),
        ]
        for key, metric_values in values.items()
    }


def evaluate_feature_set(
    joined: pd.DataFrame,
    feature_set: str,
    *,
    outer_splits: int = OUTER_SPLITS,
    outer_repeats: int = OUTER_REPEATS,
    inner_splits: int = INNER_SPLITS,
    bootstrap_iterations: int = BOOTSTRAP_ITERATIONS,
    seed: int = RANDOM_SEED,
) -> dict[str, Any]:
    x = feature_frame(joined, feature_set)
    y_original = joined[TARGET_COLUMN].to_numpy(dtype=float)
    y_transformed = bounded_logit(y_original)
    outer = RepeatedKFold(n_splits=outer_splits, n_repeats=outer_repeats, random_state=seed)

    predictions: dict[str, list[tuple[int, float]]] = {
        "mean_baseline": [],
        **{candidate.name: [] for candidate in candidate_models(seed)},
    }
    fold_metrics: dict[str, list[dict[str, float]]] = {name: [] for name in predictions}
    best_parameters: dict[str, list[dict[str, Any]]] = {
        candidate.name: [] for candidate in candidate_models(seed)
    }

    for fold_number, (train_indices, test_indices) in enumerate(outer.split(x), start=1):
        x_train, x_test = x.iloc[train_indices], x.iloc[test_indices]
        y_train = y_transformed[train_indices]
        actual = y_original[test_indices]

        baseline_prediction = np.repeat(
            float(np.mean(y_original[train_indices])), len(test_indices)
        )
        fold_metrics["mean_baseline"].append(_metrics(actual, baseline_prediction))
        predictions["mean_baseline"].extend(
            (int(index), float(value))
            for index, value in zip(test_indices, baseline_prediction, strict=True)
        )

        inner = KFold(n_splits=inner_splits, shuffle=True, random_state=seed + fold_number)
        for candidate in candidate_models(seed):
            search = GridSearchCV(
                clone(candidate.estimator),
                candidate.parameters,
                scoring=_mae_original_scale,
                cv=inner,
                n_jobs=1,
                refit=True,
                error_score="raise",
            )
            search.fit(x_train, y_train)
            predicted = inverse_bounded_logit(search.predict(x_test))
            fold_metrics[candidate.name].append(_metrics(actual, predicted))
            predictions[candidate.name].extend(
                (int(index), float(value))
                for index, value in zip(test_indices, predicted, strict=True)
            )
            best_parameters[candidate.name].append(search.best_params_)

    model_reports: dict[str, Any] = {}
    for model_name, model_predictions in predictions.items():
        aggregate = (
            pd.DataFrame(model_predictions, columns=["row", "prediction"])
            .groupby("row", sort=True)["prediction"]
            .mean()
        )
        actual = y_original[aggregate.index.to_numpy()]
        predicted = aggregate.to_numpy()
        per_fold = fold_metrics[model_name]
        model_reports[model_name] = {
            "metrics": _metrics(actual, predicted),
            "bootstrap95": _bootstrap_intervals(
                actual,
                predicted,
                iterations=bootstrap_iterations,
                seed=seed + len(model_name),
            ),
            "foldDistribution": {
                metric: {
                    "median": float(np.median([fold[metric] for fold in per_fold])),
                    "q1": float(np.quantile([fold[metric] for fold in per_fold], 0.25)),
                    "q3": float(np.quantile([fold[metric] for fold in per_fold], 0.75)),
                    "values": [float(fold[metric]) for fold in per_fold],
                }
                for metric in ("mae", "rmse", "spearman", "r2")
            },
            "participantPredictions": [
                {
                    "row": int(row),
                    "actualPercent": float(y_original[row]),
                    "predictedPercent": float(value),
                }
                for row, value in aggregate.items()
            ],
        }
        if model_name in best_parameters:
            encoded = [
                tuple(sorted(parameters.items()))
                for parameters in best_parameters[model_name]
            ]
            modal = Counter(encoded).most_common(1)[0][0]
            model_reports[model_name]["modalParameters"] = dict(modal)

    non_baselines = [name for name in model_reports if name != "mean_baseline"]
    benchmark_winner = min(non_baselines, key=lambda name: model_reports[name]["metrics"]["mae"])
    best_mae = model_reports[benchmark_winner]["metrics"]["mae"]
    ridge_mae = model_reports["ridge"]["metrics"]["mae"]
    selected = "ridge" if ridge_mae <= best_mae * 1.10 else benchmark_winner

    selected_report = model_reports[selected]
    baseline_mae = model_reports["mean_baseline"]["metrics"]["mae"]
    relative_improvement = (baseline_mae - selected_report["metrics"]["mae"]) / baseline_mae
    gate = {
        "passed": bool(
            relative_improvement >= 0.10
            and selected_report["foldDistribution"]["r2"]["median"] > 0
            and selected in {"ridge", "elastic_net"}
        ),
        "maeImprovementOverMean": float(relative_improvement),
        "requiredMaeImprovement": 0.10,
        "medianHeldOutR2": float(selected_report["foldDistribution"]["r2"]["median"]),
        "requiresPositiveMedianHeldOutR2": True,
        "linearExportSupported": selected in {"ridge", "elastic_net"},
    }
    return {
        "featureSet": feature_set,
        "participantCount": len(joined),
        "validation": {
            "outer": {
                "type": "RepeatedKFold",
                "splits": outer_splits,
                "repeats": outer_repeats,
                "participantLevel": True,
            },
            "inner": {"type": "KFold", "splits": inner_splits, "shuffle": True},
            "preprocessingInsideEachFold": True,
            "seed": seed,
        },
        "benchmarkWinner": benchmark_winner,
        "selectedForExport": selected,
        "selectionRule": (
            "Prefer Ridge when its original-scale MAE is within 10% "
            "of the best benchmark."
        ),
        "models": model_reports,
        "promotionGate": gate,
    }


def fit_export_pipeline(
    joined: pd.DataFrame, feature_set: str, report: dict[str, Any]
) -> Pipeline:
    selected = report["selectedForExport"]
    candidate = next(item for item in candidate_models() if item.name == selected)
    estimator = clone(candidate.estimator)
    estimator.set_params(**report["models"][selected]["modalParameters"])
    estimator.fit(feature_frame(joined, feature_set), bounded_logit(joined[TARGET_COLUMN]))
    return estimator
