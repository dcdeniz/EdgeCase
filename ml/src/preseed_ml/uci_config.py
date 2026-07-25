from __future__ import annotations

from pathlib import Path

from .config import DATA_ROOT, MODEL_DIR, REPORT_DIR

UCI_DATASET_ID = 244
UCI_DOI = "10.24432/C5Z01Z"
UCI_LICENCE = "CC BY 4.0"
UCI_ARCHIVE_URL = "https://archive.ics.uci.edu/static/public/244/fertility.zip"
UCI_ARCHIVE_SHA256 = "9b346e4908040f17c8980b04f13749d215af9c8b268ec0f64cffab6e94b188e0"
UCI_MEMBER_NAME = "fertility_Diagnosis.txt"
UCI_MEMBER_SHA256 = "c04c6f1a676fa6c55fa6c5ee23f9c9a4cada8e64419850767900380aec91cdbb"
UCI_RAW_DIR = DATA_ROOT / "uci_raw"
UCI_RAW_PATH = UCI_RAW_DIR / UCI_MEMBER_NAME
UCI_REPORT_PATH = REPORT_DIR / "uci-fertility-evaluation.json"
UCI_MODEL_CARD_PATH = MODEL_DIR / "UCI_MODEL_CARD.md"
UCI_MANIFEST_PATH = MODEL_DIR / "preseed-uci-fertility-screen.v0.2.0.json"

UCI_MODEL_ID = "preseed-uci-fertility-screen"
UCI_MODEL_VERSION = "0.2.0"
UCI_TRAINING_TIMESTAMP = "2026-07-25T00:00:00Z"
UCI_RANDOM_SEED = 20260725
UCI_OUTER_SPLITS = 5
UCI_OUTER_REPEATS = 5
UCI_INNER_SPLITS = 3
UCI_CALIBRATION_SPLITS = 3
UCI_BOOTSTRAP_ITERATIONS = 2_000

UCI_COLUMNS = [
    "season",
    "age_normalized",
    "childhood_diseases",
    "trauma",
    "surgery",
    "recent_fever",
    "alcohol_frequency",
    "smoking",
    "sitting_normalized",
    "diagnosis",
]
UCI_FEATURES = UCI_COLUMNS[:-1]
UCI_TARGET = "diagnosis"
UCI_ALTERED_LABEL = "O"
UCI_NORMAL_LABEL = "N"


def uci_paths() -> tuple[Path, Path, Path]:
    return UCI_REPORT_PATH, UCI_MODEL_CARD_PATH, UCI_MANIFEST_PATH
