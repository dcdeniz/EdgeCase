import hashlib
from pathlib import Path

from preseed_ml import fetch


class _Response:
    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return {
            "id": fetch.ZENODO_RECORD_ID,
            "doi": fetch.ZENODO_DOI,
            "files": [
                {
                    "key": fetch.ARCHIVE_NAME,
                    "size": fetch.ARCHIVE_SIZE,
                    "checksum": f"md5:{fetch.ARCHIVE_MD5}",
                }
            ],
        }


class _Member:
    def __init__(self, filename: str) -> None:
        self.filename = filename


class _RemoteZip:
    def __init__(self, _url: str) -> None:
        self.payloads = {member: b"ID;value\n1;1\n" for member in fetch.REMOTE_MEMBERS.values()}
        self.payloads["visem-dataset/videos/do-not-read.avi"] = b"video"

    def __enter__(self) -> "_RemoteZip":
        return self

    def __exit__(self, *_args: object) -> None:
        return None

    def infolist(self) -> list[_Member]:
        return [_Member(name) for name in self.payloads]

    def read(self, member: str) -> bytes:
        assert member in fetch.REMOTE_MEMBERS.values()
        return self.payloads[member]


def test_metadata_checksum_and_member_allowlist(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(fetch.requests, "get", lambda *_args, **_kwargs: _Response())
    monkeypatch.setattr(fetch, "RemoteZip", _RemoteZip)
    checksum = hashlib.sha256(b"ID;value\n1;1\n").hexdigest()
    monkeypatch.setattr(
        fetch,
        "MEMBER_SHA256",
        {table: checksum for table in fetch.REMOTE_MEMBERS},
    )
    manifest = fetch.fetch_allowlisted_csvs(tmp_path)
    assert set(manifest) == {"participant", "semen", "hormones"}
    assert not list(tmp_path.glob("*.avi"))
