from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from .config import (
    FEATURES,
    ID_COLUMN,
    LEAKAGE_COLUMNS,
    RAW_DATA_DIR,
    SOURCE_COLUMNS,
    TARGET_COLUMN,
)


class DatasetValidationError(ValueError):
    pass


def _read_csv(path: Path, table: str) -> pd.DataFrame:
    if not path.exists():
        raise DatasetValidationError(f"Missing {table} table: {path}")
    frame = pd.read_csv(path, sep=";", decimal=",", encoding="utf-8-sig")
    expected = SOURCE_COLUMNS[table]
    if list(frame.columns) != expected:
        raise DatasetValidationError(
            f"{table} schema mismatch. Expected {expected}; received {list(frame.columns)}"
        )
    if frame[ID_COLUMN].isna().any() or frame[ID_COLUMN].duplicated().any():
        raise DatasetValidationError(f"{table} must contain unique, non-null participant IDs")
    for column in frame.columns:
        normalized = (
            frame[column]
            .astype(str)
            .str.strip()
            .str.replace(",", ".", regex=False)
            .replace({"Not reported": pd.NA, "nan": pd.NA})
        )
        frame[column] = pd.to_numeric(normalized, errors="raise")
    return frame


def load_visem(data_dir: Path = RAW_DATA_DIR, *, require_85: bool = True) -> pd.DataFrame:
    participant = _read_csv(data_dir / "participant_related_data.csv", "participant")
    semen = _read_csv(data_dir / "semen_analysis_data.csv", "semen")
    hormones = _read_csv(data_dir / "sex_hormones.csv", "hormones")

    id_sets = [set(frame[ID_COLUMN]) for frame in (participant, semen, hormones)]
    if not (id_sets[0] == id_sets[1] == id_sets[2]):
        raise DatasetValidationError("The three source tables must have identical participant IDs")

    joined = participant.merge(
        semen[[ID_COLUMN, TARGET_COLUMN]],
        on=ID_COLUMN,
        how="inner",
        validate="one_to_one",
    ).merge(hormones, on=ID_COLUMN, how="inner", validate="one_to_one")

    if require_85 and len(joined) != 85:
        raise DatasetValidationError(f"Expected 85 VISEM participants; received {len(joined)}")
    if joined[TARGET_COLUMN].isna().any() or not joined[TARGET_COLUMN].between(0, 100).all():
        raise DatasetValidationError("Progressive motility must be present and in [0, 100]")
    if not joined["Age (years)"].dropna().between(18, 100).all():
        raise DatasetValidationError("Age is outside the accepted adult range")
    if not joined["Body mass index (kg/m²)"].dropna().between(10, 80).all():
        raise DatasetValidationError("BMI is outside the accepted validation range")
    if not joined["Abstinence time(days)"].dropna().between(0, 30).all():
        raise DatasetValidationError("Abstinence duration is outside the accepted range")
    return joined.sort_values(ID_COLUMN).reset_index(drop=True)


def feature_frame(joined: pd.DataFrame, feature_set: str) -> pd.DataFrame:
    definitions = FEATURES[feature_set]
    selected_sources = [source for source, _unit in definitions.values()]
    leaked = LEAKAGE_COLUMNS.intersection(selected_sources)
    if leaked:
        raise DatasetValidationError(f"Semen endpoint leakage detected: {sorted(leaked)}")
    frame = joined[selected_sources].copy()
    frame.columns = list(definitions)
    return frame


def write_join_metadata(joined: pd.DataFrame, path: Path) -> None:
    metadata = {
        "participantCount": int(len(joined)),
        "oneRowPerParticipant": bool(joined[ID_COLUMN].is_unique),
        "target": TARGET_COLUMN,
        "featureSets": {
            name: [
                {"name": public_name, "sourceColumn": source, "unit": unit}
                for public_name, (source, unit) in definitions.items()
            ]
            for name, definitions in FEATURES.items()
        },
        "rawDataCommitted": False,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
