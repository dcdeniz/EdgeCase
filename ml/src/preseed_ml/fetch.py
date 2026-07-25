from __future__ import annotations

import hashlib
import json
from pathlib import Path

import requests
from remotezip import RemoteZip

from .config import (
    ARCHIVE_MD5,
    ARCHIVE_NAME,
    ARCHIVE_SIZE,
    ARCHIVE_URL,
    MEMBER_SHA256,
    RAW_DATA_DIR,
    REMOTE_MEMBERS,
    ZENODO_API_URL,
    ZENODO_DOI,
    ZENODO_RECORD_ID,
)


class SourceVerificationError(RuntimeError):
    pass


def verify_record_metadata(timeout: int = 30) -> dict:
    response = requests.get(ZENODO_API_URL, timeout=timeout)
    response.raise_for_status()
    record = response.json()
    if int(record["id"]) != ZENODO_RECORD_ID or record["doi"] != ZENODO_DOI:
        raise SourceVerificationError("Zenodo record identity or DOI changed")
    files = {item["key"]: item for item in record["files"]}
    archive = files.get(ARCHIVE_NAME)
    if archive is None:
        raise SourceVerificationError(f"Zenodo record no longer contains {ARCHIVE_NAME}")
    checksum = archive["checksum"].removeprefix("md5:")
    if checksum != ARCHIVE_MD5 or int(archive["size"]) != ARCHIVE_SIZE:
        raise SourceVerificationError("Pinned VISEM archive MD5 or size does not match Zenodo")
    return record


def fetch_allowlisted_csvs(output_dir: Path = RAW_DATA_DIR) -> dict:
    """Fetch only pinned CSV members; RemoteZip uses HTTP byte ranges."""
    verify_record_metadata()
    output_dir.mkdir(parents=True, exist_ok=True)
    requested = set(REMOTE_MEMBERS.values())
    with RemoteZip(ARCHIVE_URL) as archive:
        remote_names = {item.filename for item in archive.infolist()}
        missing = requested - remote_names
        if missing:
            raise SourceVerificationError(f"Pinned CSV members missing: {sorted(missing)}")
        manifest: dict[str, dict[str, str | int]] = {}
        for table, member in REMOTE_MEMBERS.items():
            if member not in requested:
                raise SourceVerificationError(f"Member is not allow-listed: {member}")
            payload = archive.read(member)
            checksum = hashlib.sha256(payload).hexdigest()
            if checksum != MEMBER_SHA256[table]:
                raise SourceVerificationError(
                    f"Checksum mismatch for allow-listed member: {member}"
                )
            destination = output_dir / Path(member).name
            destination.write_bytes(payload)
            manifest[table] = {
                "member": member,
                "bytes": len(payload),
                "sha256": checksum,
            }
    (output_dir / "fetch-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    return manifest
