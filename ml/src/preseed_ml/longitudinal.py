from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any

import numpy as np
import pandas as pd

WINDOWS_DAYS = (30, 60, 90)

OUTCOMES = {
    "progressiveMotilityPercent": (0.0, 100.0),
    "spermConcentrationMillionMl": (0.0, None),
    "totalSpermCountMillion": (0.0, None),
    "normalMorphologyPercent": (0.0, 100.0),
}

DAILY_MEANS = (
    "sleepHours",
    "steps",
    "activeMinutes",
    "sedentaryMinutes",
    "dietDiversityScore",
    "mediterraneanDietScore",
    "fruitVegetableServings",
)

DAILY_SUMS = (
    "alcoholUnits",
    "bingeEvent",
    "nicotineUses",
    "processedMeatServings",
    "sugaryDrinks",
    "fishServings",
    "heatMinutes",
    "feverDay",
)

HORMONE_FIELDS = (
    "totalTestosteroneNmolL",
    "estradiolNmolL",
    "shbgNmolL",
    "fshIUL",
    "lhIUL",
)


class LongitudinalValidationError(ValueError):
    pass


def _timestamp(value: Any, field: str) -> pd.Timestamp:
    try:
        parsed = pd.Timestamp(value)
    except (TypeError, ValueError) as error:
        raise LongitudinalValidationError(f"{field} must be an ISO date or timestamp") from error
    if parsed.tzinfo is None:
        parsed = parsed.tz_localize("UTC")
    return parsed.tz_convert("UTC")


def _finite_number(value: Any, field: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise LongitudinalValidationError(f"{field} must be numeric") from error
    if not np.isfinite(number):
        raise LongitudinalValidationError(f"{field} must be finite")
    return number


def _validate_test(test: Mapping[str, Any]) -> None:
    for field, (minimum, maximum) in OUTCOMES.items():
        if field not in test:
            continue
        value = _finite_number(test[field], field)
        if value < minimum or (maximum is not None and value > maximum):
            raise LongitudinalValidationError(f"{field} is outside its accepted range")
    abstinence = _finite_number(test["abstinenceDays"], "abstinenceDays")
    if not 0 <= abstinence <= 30:
        raise LongitudinalValidationError("abstinenceDays must be in [0, 30]")


def _aggregate_daily(
    observations: list[Mapping[str, Any]],
    target_at: pd.Timestamp,
    window_days: int,
) -> dict[str, float]:
    start = target_at.normalize() - pd.Timedelta(days=window_days)
    target_day = target_at.normalize()
    eligible = [
        observation
        for observation in observations
        if start
        <= _timestamp(observation["date"], "dailyObservations.date").normalize()
        < target_day
    ]
    output: dict[str, float] = {
        f"logCoverage{window_days}d": len(
            {
                _timestamp(observation["date"], "dailyObservations.date").normalize()
                for observation in eligible
            }
        )
        / window_days
    }
    for field in DAILY_MEANS:
        values = [
            _finite_number(observation[field], field)
            for observation in eligible
            if observation.get(field) is not None
        ]
        output[f"{field}Mean{window_days}d"] = (
            float(np.mean(values)) if values else float("nan")
        )
    for field in DAILY_SUMS:
        values = [
            _finite_number(observation[field], field)
            for observation in eligible
            if observation.get(field) is not None
        ]
        output[f"{field}Total{window_days}d"] = (
            float(np.sum(values)) if values else float("nan")
        )
    return output


def _latest_hormones(
    measurements: list[Mapping[str, Any]], target_at: pd.Timestamp
) -> dict[str, float]:
    eligible = [
        measurement
        for measurement in measurements
        if _timestamp(measurement["measuredAt"], "hormoneMeasurements.measuredAt")
        < target_at
    ]
    if not eligible:
        return {field: float("nan") for field in HORMONE_FIELDS} | {
            "hormoneMeasurementAgeDays": float("nan")
        }
    latest = max(
        eligible,
        key=lambda measurement: _timestamp(
            measurement["measuredAt"], "hormoneMeasurements.measuredAt"
        ),
    )
    measured_at = _timestamp(latest["measuredAt"], "hormoneMeasurements.measuredAt")
    values = {
        field: (
            _finite_number(latest[field], field)
            if latest.get(field) is not None
            else float("nan")
        )
        for field in HORMONE_FIELDS
    }
    values["hormoneMeasurementAgeDays"] = (
        target_at - measured_at
    ).total_seconds() / 86_400
    return values


def _unique_ids(records: Iterable[Mapping[str, Any]], field: str, label: str) -> None:
    values = [str(record[field]) for record in records]
    if len(values) != len(set(values)):
        raise LongitudinalValidationError(f"{label} contains duplicate {field} values")


def build_followup_rows(payload: Mapping[str, Any]) -> pd.DataFrame:
    """Create one leakage-safe row for each follow-up semen test."""
    participants = payload.get("participants", [])
    semen_tests = payload.get("semenTests", [])
    daily = payload.get("dailyObservations", [])
    hormones = payload.get("hormoneMeasurements", [])
    if not participants or not semen_tests:
        raise LongitudinalValidationError("participants and semenTests are required")

    _unique_ids(participants, "participantId", "participants")
    _unique_ids(semen_tests, "testId", "semenTests")
    participant_map = {str(item["participantId"]): item for item in participants}
    known_participants = set(participant_map)
    for collection, label in (
        (semen_tests, "semenTests"),
        (daily, "dailyObservations"),
        (hormones, "hormoneMeasurements"),
    ):
        unknown = {str(item["participantId"]) for item in collection} - known_participants
        if unknown:
            raise LongitudinalValidationError(
                f"{label} references unknown participants: {sorted(unknown)}"
            )

    tests_by_participant: dict[str, list[Mapping[str, Any]]] = {}
    for test in semen_tests:
        _validate_test(test)
        tests_by_participant.setdefault(str(test["participantId"]), []).append(test)

    rows: list[dict[str, Any]] = []
    for participant_id, tests in tests_by_participant.items():
        ordered = sorted(
            tests,
            key=lambda test: _timestamp(test["collectedAt"], "semenTests.collectedAt"),
        )
        if len(
            {
                _timestamp(test["collectedAt"], "semenTests.collectedAt")
                for test in ordered
            }
        ) != len(ordered):
            raise LongitudinalValidationError(
                f"Participant {participant_id} has duplicate collection timestamps"
            )
        participant_daily = [
            item for item in daily if str(item["participantId"]) == participant_id
        ]
        participant_hormones = [
            item for item in hormones if str(item["participantId"]) == participant_id
        ]
        for previous, target in zip(ordered[:-1], ordered[1:], strict=True):
            target_at = _timestamp(target["collectedAt"], "semenTests.collectedAt")
            previous_at = _timestamp(previous["collectedAt"], "semenTests.collectedAt")
            row: dict[str, Any] = {
                "participantId": participant_id,
                "targetTestId": str(target["testId"]),
                "targetCollectedAt": target_at.isoformat(),
                "siteId": str(target["siteId"]),
                "labId": str(target["labId"]),
                "ageYears": _finite_number(target["ageYears"], "ageYears"),
                "bmi": _finite_number(target["bmi"], "bmi"),
                "daysSincePreviousTest": (target_at - previous_at).total_seconds() / 86_400,
                "currentAbstinenceDays": _finite_number(
                    target["abstinenceDays"], "abstinenceDays"
                ),
                "previousAbstinenceDays": _finite_number(
                    previous["abstinenceDays"], "abstinenceDays"
                ),
                "collectionComplete": float(bool(target["collectionComplete"])),
                "transportMinutes": _finite_number(
                    target["transportMinutes"], "transportMinutes"
                ),
                "recentFeverAtCollection": float(bool(target["recentFever"])),
                "exogenousTestosterone": float(
                    bool(target.get("exogenousTestosterone", False))
                ),
                "anabolicSteroidUse": float(bool(target.get("anabolicSteroidUse", False))),
                "relevantMedicationCount": _finite_number(
                    target.get("relevantMedicationCount", 0), "relevantMedicationCount"
                ),
                "previousProgressiveMotilityPercent": _finite_number(
                    previous["progressiveMotilityPercent"],
                    "previousProgressiveMotilityPercent",
                ),
                "previousSpermConcentrationMillionMl": _finite_number(
                    previous["spermConcentrationMillionMl"],
                    "previousSpermConcentrationMillionMl",
                ),
                "previousTotalSpermCountMillion": _finite_number(
                    previous["totalSpermCountMillion"],
                    "previousTotalSpermCountMillion",
                ),
                "previousNormalMorphologyPercent": _finite_number(
                    previous["normalMorphologyPercent"],
                    "previousNormalMorphologyPercent",
                ),
            }
            for outcome in OUTCOMES:
                row[f"target_{outcome}"] = _finite_number(target[outcome], outcome)
            for window in WINDOWS_DAYS:
                row.update(_aggregate_daily(participant_daily, target_at, window))
            row.update(_latest_hormones(participant_hormones, target_at))
            rows.append(row)

    if not rows:
        raise LongitudinalValidationError("At least one participant needs two semen tests")
    return pd.DataFrame(rows).sort_values(
        ["targetCollectedAt", "participantId", "targetTestId"]
    ).reset_index(drop=True)


def predictor_columns(rows: pd.DataFrame) -> list[str]:
    excluded = {
        "participantId",
        "targetTestId",
        "targetCollectedAt",
        "siteId",
        "labId",
    }
    return [
        column
        for column in rows.columns
        if column not in excluded and not column.startswith("target_")
    ]


def prospective_feature_sets(rows: pd.DataFrame) -> dict[str, list[str]]:
    """Return predeclared blocks so all 30/60/90-day features are not used blindly."""
    previous = [
        "previousProgressiveMotilityPercent",
        "previousSpermConcentrationMillionMl",
        "previousTotalSpermCountMillion",
        "previousNormalMorphologyPercent",
    ]
    collection = previous + [
        "ageYears",
        "bmi",
        "daysSincePreviousTest",
        "currentAbstinenceDays",
        "previousAbstinenceDays",
        "collectionComplete",
        "transportMinutes",
        "recentFeverAtCollection",
    ]
    clinical = collection + [
        "exogenousTestosterone",
        "anabolicSteroidUse",
        "relevantMedicationCount",
        *HORMONE_FIELDS,
        "hormoneMeasurementAgeDays",
    ]
    primary_90_day = clinical + [
        column
        for column in predictor_columns(rows)
        if column.endswith("90d")
    ]
    return {
        "previous_test": previous,
        "previous+collection": collection,
        "previous+clinical": clinical,
        "previous+clinical+90d": primary_90_day,
        "multiscale_exploratory": predictor_columns(rows),
    }
