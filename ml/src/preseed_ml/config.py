from __future__ import annotations

from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = PACKAGE_ROOT.parent
DATA_ROOT = PACKAGE_ROOT / "data"
RAW_DATA_DIR = DATA_ROOT / "raw"
MODEL_DIR = PACKAGE_ROOT / "models"
REPORT_DIR = PACKAGE_ROOT / "reports"

ZENODO_RECORD_ID = 2640506
ZENODO_DOI = "10.5281/zenodo.2640506"
ZENODO_API_URL = f"https://zenodo.org/api/records/{ZENODO_RECORD_ID}"
ARCHIVE_NAME = "visem-dataset.zip"
ARCHIVE_URL = (
    f"https://zenodo.org/records/{ZENODO_RECORD_ID}/files/{ARCHIVE_NAME}?download=1"
)
ARCHIVE_SIZE = 35_214_812_547
ARCHIVE_MD5 = "c4ab1788457fa3395d94bb643559f6c5"
LICENCE = "CC BY-NC 4.0"

REMOTE_MEMBERS = {
    "participant": "visem-dataset/participant_related_data.csv",
    "semen": "visem-dataset/semen_analysis_data.csv",
    "hormones": "visem-dataset/sex_hormones.csv",
}
MEMBER_SHA256 = {
    "participant": "2731ff291118b2bbc0d5a2d6c0bec1ef593a903793489ee5646d333af8d55702",
    "semen": "2fa0825aa19550aabdd2c2ee1fc77d62068fee7c890df2bc98ff2962e8826080",
    "hormones": "9318552669921f7450fa3bce3412014c4c252887e7351ccfde9709a170e3109d",
}

RANDOM_SEED = 20260725
OUTER_SPLITS = 5
OUTER_REPEATS = 5
INNER_SPLITS = 5
BOOTSTRAP_ITERATIONS = 2_000
MODEL_ID = "preseed-visem-progressive-motility"
MODEL_VERSION = "0.1.0"
TRAINING_TIMESTAMP = "2026-07-25T00:00:00Z"

TARGET_COLUMN = "Progressive motility (%)"
ID_COLUMN = "ID"

SOURCE_COLUMNS = {
    "participant": [
        "ID",
        "Abstinence time(days)",
        "Body mass index (kg/m²)",
        "Age (years)",
    ],
    "semen": [
        "ID",
        "Sperm concentration (x10⁶/mL)",
        "Total sperm count (x10⁶)",
        "Ejaculate volume (mL)",
        "Sperm vitality (%)",
        "Normal spermatozoa (%)",
        "Head defects (%)",
        "Midpiece and neck defects (%)",
        "Tail defects (%)",
        "Cytoplasmic droplet (%)",
        "Teratozoospermia index",
        "Progressive motility (%)",
        "Non progressive sperm motility (%)",
        "Immotile sperm (%)",
        "High DNA stainability, HDS (%)",
        "DNA fragmentation index, DFI (%)",
    ],
    "hormones": [
        "ID",
        "Seminal plasma anti-Müllerian hormone (AMH) (pmol/L)",
        "Serum total testosterone (nmol/L)",
        "Serum oestradiol (nmol/L)",
        "Serum sex hormone-binding globulin, SHBG (nmol/L)",
        "Serum follicle-stimulating hormone, FSH (IU/L)",
        "Serum Luteinizing hormone, LH (IU/L)",
        "Serum inhibin B (ng/L)",
        "Serum anti-Müllerian hormone, AMH (pmol/L)",
    ],
}

FEATURES = {
    "core": {
        "ageYears": ("Age (years)", "years"),
        "bmi": ("Body mass index (kg/m²)", "kg/m²"),
        "abstinenceDays": ("Abstinence time(days)", "days"),
    },
    "core+hormones": {
        "ageYears": ("Age (years)", "years"),
        "bmi": ("Body mass index (kg/m²)", "kg/m²"),
        "abstinenceDays": ("Abstinence time(days)", "days"),
        "totalTestosteroneNmolL": ("Serum total testosterone (nmol/L)", "nmol/L"),
        "estradiolNmolL": ("Serum oestradiol (nmol/L)", "nmol/L"),
        "shbgNmolL": ("Serum sex hormone-binding globulin, SHBG (nmol/L)", "nmol/L"),
        "fshIUL": ("Serum follicle-stimulating hormone, FSH (IU/L)", "IU/L"),
        "lhIUL": ("Serum Luteinizing hormone, LH (IU/L)", "IU/L"),
    },
}

LEAKAGE_COLUMNS = set(SOURCE_COLUMNS["semen"]) - {ID_COLUMN, TARGET_COLUMN}
