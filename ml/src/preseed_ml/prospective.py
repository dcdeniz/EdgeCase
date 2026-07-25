from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .config import RANDOM_SEED


@dataclass(frozen=True)
class ValidationSplit:
    name: str
    train_indices: np.ndarray
    test_indices: np.ndarray


def participant_folds(rows: pd.DataFrame, n_splits: int = 5) -> list[ValidationSplit]:
    groups = rows["participantId"].astype(str)
    if groups.nunique() < n_splits:
        raise ValueError("n_splits cannot exceed the number of participants")
    splitter = GroupKFold(n_splits=n_splits)
    return [
        ValidationSplit(f"participant_fold_{number}", train, test)
        for number, (train, test) in enumerate(
            splitter.split(rows, groups=groups), start=1
        )
    ]


def site_holdout(rows: pd.DataFrame, site_id: str) -> ValidationSplit:
    test_mask = rows["siteId"].astype(str) == str(site_id)
    if not test_mask.any() or test_mask.all():
        raise ValueError("Site holdout requires rows inside and outside the selected site")
    return ValidationSplit(
        f"site_{site_id}",
        np.flatnonzero(~test_mask.to_numpy()),
        np.flatnonzero(test_mask.to_numpy()),
    )


def temporal_holdout(rows: pd.DataFrame, cutoff: str) -> ValidationSplit:
    collected = pd.to_datetime(rows["targetCollectedAt"], utc=True)
    cutoff_at = pd.Timestamp(cutoff)
    if cutoff_at.tzinfo is None:
        cutoff_at = cutoff_at.tz_localize("UTC")
    else:
        cutoff_at = cutoff_at.tz_convert("UTC")
    test_mask = collected >= cutoff_at
    if not test_mask.any() or test_mask.all():
        raise ValueError("Temporal holdout requires observations before and after cutoff")
    return ValidationSplit(
        f"temporal_{cutoff_at.date()}",
        np.flatnonzero(~test_mask.to_numpy()),
        np.flatnonzero(test_mask.to_numpy()),
    )


def previous_result_baseline(
    rows: pd.DataFrame, outcome: str = "progressiveMotilityPercent"
) -> dict[str, float]:
    target = rows[f"target_{outcome}"].to_numpy(dtype=float)
    previous_name = {
        "progressiveMotilityPercent": "previousProgressiveMotilityPercent",
        "spermConcentrationMillionMl": "previousSpermConcentrationMillionMl",
        "totalSpermCountMillion": "previousTotalSpermCountMillion",
        "normalMorphologyPercent": "previousNormalMorphologyPercent",
    }[outcome]
    predicted = rows[previous_name].to_numpy(dtype=float)
    return regression_metrics(target, predicted)


def regression_metrics(actual: np.ndarray, predicted: np.ndarray) -> dict[str, float]:
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


def prospective_candidates(seed: int = RANDOM_SEED) -> dict[str, Pipeline]:
    return {
        "ridge": Pipeline(
            [
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                ("model", Ridge(alpha=10.0)),
            ]
        ),
        "hist_gradient_boosting": Pipeline(
            [
                ("imputer", SimpleImputer(strategy="median")),
                (
                    "model",
                    HistGradientBoostingRegressor(
                        learning_rate=0.05,
                        max_depth=3,
                        max_iter=200,
                        min_samples_leaf=20,
                        l2_regularization=1.0,
                        random_state=seed,
                    ),
                ),
            ]
        ),
    }


def assert_split_isolation(rows: pd.DataFrame, split: ValidationSplit) -> None:
    if split.name.startswith("participant_fold_"):
        train_participants = set(rows.iloc[split.train_indices]["participantId"])
        test_participants = set(rows.iloc[split.test_indices]["participantId"])
        overlap = train_participants.intersection(test_participants)
        if overlap:
            raise AssertionError(f"Participant leakage detected: {sorted(overlap)}")


def split_summary(rows: pd.DataFrame, split: ValidationSplit) -> dict[str, Any]:
    return {
        "name": split.name,
        "trainRows": int(len(split.train_indices)),
        "testRows": int(len(split.test_indices)),
        "trainParticipants": int(
            rows.iloc[split.train_indices]["participantId"].nunique()
        ),
        "testParticipants": int(rows.iloc[split.test_indices]["participantId"].nunique()),
        "testSites": sorted(rows.iloc[split.test_indices]["siteId"].astype(str).unique()),
    }
