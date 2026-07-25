import json
from pathlib import Path

import pandas as pd
import pytest

from preseed_ml.config import LEAKAGE_COLUMNS, SOURCE_COLUMNS
from preseed_ml.dataset import DatasetValidationError, feature_frame, load_visem

FIXTURES = Path(__file__).parent / "fixtures"


def test_strict_schema_join_types_ranges_and_cardinality() -> None:
    joined = load_visem(FIXTURES, require_85=False)
    assert len(joined) == 15
    assert joined["ID"].is_unique
    assert pd.api.types.is_numeric_dtype(joined["Progressive motility (%)"])


def test_committed_source_schema_matches_executable_schema() -> None:
    schema_path = Path(__file__).parents[1] / "data" / "source-schemas.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    assert schema["tables"] == SOURCE_COLUMNS


def test_no_semen_endpoint_enters_features() -> None:
    joined = load_visem(FIXTURES, require_85=False)
    for feature_set in ("core", "core+hormones"):
        features = feature_frame(joined, feature_set)
        assert not LEAKAGE_COLUMNS.intersection(features.columns)
        assert "Progressive motility (%)" not in features.columns


def test_duplicate_participant_id_is_rejected(tmp_path: Path) -> None:
    for source in FIXTURES.glob("*.csv"):
        destination = tmp_path / source.name
        destination.write_bytes(source.read_bytes())
    participant = tmp_path / "participant_related_data.csv"
    participant.write_text(
        participant.read_text(encoding="utf-8") + "1;2,0;21,0;22\n",
        encoding="utf-8",
    )
    with pytest.raises(DatasetValidationError, match="unique"):
        load_visem(tmp_path, require_85=False)


def test_join_requires_identical_participant_ids(tmp_path: Path) -> None:
    for source in FIXTURES.glob("*.csv"):
        destination = tmp_path / source.name
        destination.write_bytes(source.read_bytes())
    hormone_path = tmp_path / "sex_hormones.csv"
    hormone_path.write_text(
        hormone_path.read_text(encoding="utf-8").replace("\n15;", "\n99;"),
        encoding="utf-8",
    )
    with pytest.raises(DatasetValidationError, match="identical"):
        load_visem(tmp_path, require_85=False)
