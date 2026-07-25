from __future__ import annotations

import hashlib
import io
import zipfile
from pathlib import Path

import pandas as pd
import pytest

from preseed_ml import uci_dataset
from preseed_ml.uci_config import UCI_COLUMNS, UCI_FEATURES


def synthetic_uci_frame() -> pd.DataFrame:
    rows = []
    for index in range(100):
        altered = index < 12
        rows.append(
            [
                [-1.0, -0.33, 0.33, 1.0][index % 4],
                round((index % 50) / 50, 2),
                float(index % 2),
                float((index // 2) % 2),
                float((index // 3) % 2),
                [-1.0, 0.0, 1.0][index % 3],
                [0.0, 0.2, 0.4, 0.6, 0.8, 1.0][index % 6],
                [-1.0, 0.0, 1.0][(index // 2) % 3],
                round((index % 25) / 25, 2),
                "O" if altered else "N",
            ]
        )
    return pd.DataFrame(rows, columns=UCI_COLUMNS)


def write_synthetic_uci(path: Path) -> None:
    synthetic_uci_frame().to_csv(path, header=False, index=False)


def test_uci_schema_ranges_counts_and_target_separation(tmp_path: Path) -> None:
    path = tmp_path / "fertility_Diagnosis.txt"
    write_synthetic_uci(path)
    frame = uci_dataset.load_uci_fertility(path)
    features, target = uci_dataset.uci_feature_target(frame)
    assert list(features.columns) == UCI_FEATURES
    assert "diagnosis" not in features.columns
    assert target.value_counts().to_dict() == {0: 88, 1: 12}


def test_uci_validation_rejects_changed_class_counts(tmp_path: Path) -> None:
    path = tmp_path / "fertility_Diagnosis.txt"
    frame = synthetic_uci_frame()
    frame.loc[12, "diagnosis"] = "O"
    frame.to_csv(path, header=False, index=False)
    with pytest.raises(ValueError, match="Unexpected class counts"):
        uci_dataset.load_uci_fertility(path)


def test_uci_fetch_enforces_archive_and_member_allowlist(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    member = synthetic_uci_frame().to_csv(header=False, index=False).encode()
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as bundle:
        bundle.writestr("fertility_Diagnosis.txt", member)
    archive = buffer.getvalue()
    monkeypatch.setattr(uci_dataset, "UCI_ARCHIVE_SHA256", hashlib.sha256(archive).hexdigest())
    monkeypatch.setattr(uci_dataset, "UCI_MEMBER_SHA256", hashlib.sha256(member).hexdigest())

    class Response:
        content = archive

        @staticmethod
        def raise_for_status() -> None:
            return None

    class Session:
        @staticmethod
        def get(_url: str, timeout: int) -> Response:
            assert timeout == 30
            return Response()

    destination = tmp_path / "fertility_Diagnosis.txt"
    result = uci_dataset.fetch_uci_fertility(destination, session=Session())
    assert destination.read_bytes() == member
    assert result["member"] == "fertility_Diagnosis.txt"
