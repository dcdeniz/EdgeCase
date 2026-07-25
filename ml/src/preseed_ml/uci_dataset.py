from __future__ import annotations

import hashlib
import io
import zipfile
from pathlib import Path
from typing import Any

import pandas as pd
import requests

from .uci_config import (
    UCI_ALTERED_LABEL,
    UCI_ARCHIVE_SHA256,
    UCI_ARCHIVE_URL,
    UCI_COLUMNS,
    UCI_FEATURES,
    UCI_MEMBER_NAME,
    UCI_MEMBER_SHA256,
    UCI_NORMAL_LABEL,
    UCI_RAW_DIR,
    UCI_RAW_PATH,
)


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def fetch_uci_fertility(
    destination: Path = UCI_RAW_PATH,
    *,
    session: Any = requests,
) -> dict[str, Any]:
    response = session.get(UCI_ARCHIVE_URL, timeout=30)
    response.raise_for_status()
    archive = bytes(response.content)
    if sha256_bytes(archive) != UCI_ARCHIVE_SHA256:
        raise ValueError("UCI archive SHA-256 does not match the pinned source")

    with zipfile.ZipFile(io.BytesIO(archive)) as bundle:
        members = bundle.namelist()
        if members != [UCI_MEMBER_NAME]:
            raise ValueError(f"Unexpected UCI archive members: {members}")
        member = bundle.read(UCI_MEMBER_NAME)
    if sha256_bytes(member) != UCI_MEMBER_SHA256:
        raise ValueError("UCI member SHA-256 does not match the pinned source")

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(member)
    return {
        "archiveUrl": UCI_ARCHIVE_URL,
        "archiveSha256": UCI_ARCHIVE_SHA256,
        "member": UCI_MEMBER_NAME,
        "memberSha256": UCI_MEMBER_SHA256,
        "bytes": len(member),
        "destination": str(destination),
    }


def _assert_set(series: pd.Series, values: set[float] | set[str], name: str) -> None:
    observed = set(series.dropna().unique())
    if not observed <= values:
        raise ValueError(f"{name} contains unsupported values: {sorted(observed - values)}")


def load_uci_fertility(path: Path = UCI_RAW_PATH) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Missing UCI data at {path}; run `preseed-ml uci-fetch`")
    frame = pd.read_csv(path, header=None, names=UCI_COLUMNS)
    if frame.shape != (100, 10):
        raise ValueError(f"Expected 100 rows and 10 columns, received {frame.shape}")
    if frame.isna().any().any():
        raise ValueError("UCI Fertility must not contain missing values")

    for column in UCI_FEATURES:
        frame[column] = pd.to_numeric(frame[column], errors="raise")
    _assert_set(frame["season"], {-1.0, -0.33, 0.33, 1.0}, "season")
    _assert_set(frame["childhood_diseases"], {0.0, 1.0}, "childhood_diseases")
    _assert_set(frame["trauma"], {0.0, 1.0}, "trauma")
    _assert_set(frame["surgery"], {0.0, 1.0}, "surgery")
    _assert_set(frame["recent_fever"], {-1.0, 0.0, 1.0}, "recent_fever")
    _assert_set(
        frame["alcohol_frequency"],
        {0.0, 0.2, 0.4, 0.6, 0.8, 1.0},
        "alcohol_frequency",
    )
    _assert_set(frame["smoking"], {-1.0, 0.0, 1.0}, "smoking")
    _assert_set(frame["diagnosis"], {UCI_NORMAL_LABEL, UCI_ALTERED_LABEL}, "diagnosis")
    for column in ("age_normalized", "sitting_normalized"):
        if not frame[column].between(0, 1, inclusive="both").all():
            raise ValueError(f"{column} must be bounded from zero to one")

    counts = frame["diagnosis"].value_counts().to_dict()
    expected = {UCI_NORMAL_LABEL: 88, UCI_ALTERED_LABEL: 12}
    if counts != expected:
        raise ValueError(f"Unexpected class counts: {counts}")
    return frame


def uci_feature_target(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    features = frame[UCI_FEATURES].copy()
    target = (frame["diagnosis"] == UCI_ALTERED_LABEL).astype(int)
    return features, target


def ensure_uci_raw_directory() -> Path:
    UCI_RAW_DIR.mkdir(parents=True, exist_ok=True)
    return UCI_RAW_DIR
