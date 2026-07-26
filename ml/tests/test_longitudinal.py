import copy
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker

from preseed_ml.longitudinal import (
    LongitudinalValidationError,
    build_followup_rows,
    predictor_columns,
    prospective_feature_sets,
)

FIXTURES = Path(__file__).parent / "fixtures"
SCHEMA = Path(__file__).parents[1] / "schemas" / "prospective-cohort.schema.json"


def _payload() -> dict:
    return json.loads(
        (FIXTURES / "prospective-cohort.synthetic.json").read_text(encoding="utf-8")
    )


def test_synthetic_cohort_matches_contract_and_builds_followups() -> None:
    payload = _payload()
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(payload)
    rows = build_followup_rows(payload)
    assert len(rows) == 8
    assert rows["participantId"].nunique() == 4
    assert set(rows["targetTestId"]) == {
        "s001-b",
        "s001-c",
        "s002-b",
        "s002-c",
        "s003-b",
        "s003-c",
        "s004-b",
        "s004-c",
    }
    assert not any(column.startswith("target_") for column in predictor_columns(rows))
    feature_sets = prospective_feature_sets(rows)
    assert len(feature_sets["previous_test"]) == 4
    assert len(feature_sets["previous+clinical+90d"]) < len(
        feature_sets["multiscale_exploratory"]
    )
    assert all(
        not column.startswith("target_")
        for columns in feature_sets.values()
        for column in columns
    )


def test_features_use_only_observations_before_target() -> None:
    payload = _payload()
    baseline = build_followup_rows(payload)
    modified = copy.deepcopy(payload)
    modified["dailyObservations"].extend(
        [
            {
                "participantId": "synthetic-001",
                "date": "2026-07-15",
                "alcoholUnits": 999,
            },
            {
                "participantId": "synthetic-001",
                "date": "2026-07-16",
                "alcoholUnits": 999,
            },
        ]
    )
    modified["hormoneMeasurements"].append(
        {
            "participantId": "synthetic-001",
            "measuredAt": "2026-07-15T10:00:00Z",
            "totalTestosteroneNmolL": 999
        }
    )
    rebuilt = build_followup_rows(modified)
    baseline_row = baseline.loc[baseline["targetTestId"] == "s001-c"].iloc[0]
    rebuilt_row = rebuilt.loc[rebuilt["targetTestId"] == "s001-c"].iloc[0]
    assert rebuilt_row["alcoholUnitsTotal30d"] == baseline_row["alcoholUnitsTotal30d"]
    assert rebuilt_row["totalTestosteroneNmolL"] == baseline_row["totalTestosteroneNmolL"]


def test_duplicate_and_unknown_ids_are_rejected() -> None:
    duplicate = _payload()
    duplicate["participants"].append({"participantId": "synthetic-001"})
    with pytest.raises(LongitudinalValidationError, match="duplicate"):
        build_followup_rows(duplicate)

    unknown = _payload()
    unknown["dailyObservations"][0]["participantId"] = "unknown"
    with pytest.raises(LongitudinalValidationError, match="unknown"):
        build_followup_rows(unknown)
