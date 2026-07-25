import json
from pathlib import Path

from preseed_ml.longitudinal import build_followup_rows
from preseed_ml.prospective import (
    assert_split_isolation,
    participant_folds,
    previous_result_baseline,
    prospective_candidates,
    site_holdout,
    split_summary,
    temporal_holdout,
)

FIXTURE = Path(__file__).parent / "fixtures" / "prospective-cohort.synthetic.json"


def _rows():
    return build_followup_rows(json.loads(FIXTURE.read_text(encoding="utf-8")))


def test_previous_result_baseline_is_available_for_every_named_outcome() -> None:
    rows = _rows()
    for outcome in (
        "progressiveMotilityPercent",
        "spermConcentrationMillionMl",
        "totalSpermCountMillion",
        "normalMorphologyPercent",
    ):
        metrics = previous_result_baseline(rows, outcome)
        assert set(metrics) == {"mae", "rmse", "spearman", "r2"}
        assert metrics["mae"] >= 0


def test_participant_folds_have_no_identity_leakage() -> None:
    rows = _rows()
    splits = participant_folds(rows, n_splits=2)
    assert len(splits) == 2
    for split in splits:
        assert_split_isolation(rows, split)
        summary = split_summary(rows, split)
        assert summary["trainParticipants"] == 2
        assert summary["testParticipants"] == 2


def test_site_and_temporal_holdouts_are_explicit() -> None:
    rows = _rows()
    site = site_holdout(rows, "site-b")
    assert set(rows.iloc[site.test_indices]["siteId"]) == {"site-b"}
    temporal = temporal_holdout(rows, "2026-06-01")
    assert len(temporal.train_indices) == 4
    assert len(temporal.test_indices) == 4


def test_prospective_candidates_keep_preprocessing_in_pipelines() -> None:
    candidates = prospective_candidates(seed=7)
    assert list(candidates["ridge"].named_steps) == ["imputer", "scaler", "model"]
    assert list(candidates["hist_gradient_boosting"].named_steps) == ["imputer", "model"]
