from __future__ import annotations

import argparse
import json
from pathlib import Path

from .artifact import build_artifact, write_json
from .config import MODEL_DIR, MODEL_VERSION, PACKAGE_ROOT, RAW_DATA_DIR, REPORT_DIR
from .dataset import load_visem, write_join_metadata
from .fetch import fetch_allowlisted_csvs
from .longitudinal import build_followup_rows, prospective_feature_sets
from .modeling import evaluate_feature_set
from .prospective import previous_result_baseline
from .reporting import write_model_card
from .uci_dataset import fetch_uci_fertility, load_uci_fertility
from .uci_modeling import evaluate_uci_fertility
from .uci_reporting import write_uci_outputs
from .verification import verify_generated_reports


def regenerate(data_dir: Path = RAW_DATA_DIR) -> dict:
    joined = load_visem(data_dir)
    reports = {
        feature_set: evaluate_feature_set(joined, feature_set)
        for feature_set in ("core", "core+hormones")
    }
    evaluation = {
        "schemaVersion": 1,
        "target": "progressiveMotilityPercent",
        "researchOnly": True,
        "featureSets": reports,
    }
    artifact = build_artifact(joined, reports)
    write_json(evaluation, REPORT_DIR / "evaluation.json")
    write_json(
        artifact,
        MODEL_DIR / f"preseed-visem-progressive-motility.v{MODEL_VERSION}.json",
    )
    write_model_card(artifact, reports, MODEL_DIR / "MODEL_CARD.md")
    write_join_metadata(joined, REPORT_DIR / "dataset-join.json")
    return evaluation


def regenerate_uci() -> dict:
    frame = load_uci_fertility()
    evaluation = evaluate_uci_fertility(frame)
    write_uci_outputs(evaluation)
    return evaluation


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="PreSeed VISEM research baseline")
    subcommands = parser.add_subparsers(dest="command", required=True)
    subcommands.add_parser("fetch", help="Range-fetch only the allow-listed VISEM CSVs")
    subcommands.add_parser("validate", help="Validate schemas, values, and one-to-one joins")
    subcommands.add_parser("train", help="Train, evaluate, and export the deterministic baseline")
    subcommands.add_parser("evaluate", help="Regenerate the machine-readable evaluation report")
    subcommands.add_parser("export", help="Regenerate the reviewed JSON artifact and model card")
    subcommands.add_parser("regenerate", help="Run validate, nested CV, evaluation, and export")
    subcommands.add_parser(
        "uci-fetch",
        help="Fetch and verify the official allow-listed UCI Fertility member",
    )
    subcommands.add_parser(
        "uci-validate",
        help="Validate the pinned UCI Fertility schema, ranges, and class counts",
    )
    subcommands.add_parser(
        "uci-regenerate",
        help="Run repeated nested UCI evaluation and regenerate its research reports",
    )
    subcommands.add_parser(
        "verify-generated",
        help="Verify regenerated reports against reviewed cross-platform safety contracts",
    )
    prospective = subcommands.add_parser(
        "validate-prospective",
        help="Validate and feature-build a prospective repeated-test cohort",
    )
    prospective.add_argument(
        "--input",
        type=Path,
        default=PACKAGE_ROOT / "tests/fixtures/prospective-cohort.synthetic.json",
    )
    return parser


def main() -> None:
    args = _parser().parse_args()
    if args.command == "fetch":
        print(json.dumps(fetch_allowlisted_csvs(), indent=2))
        return
    if args.command == "validate":
        joined = load_visem()
        print(f"Validated {len(joined)} participants with a one-to-one three-table join.")
        return
    if args.command == "validate-prospective":
        payload = json.loads(args.input.read_text(encoding="utf-8"))
        rows = build_followup_rows(payload)
        summary = {
            "synthetic": bool(payload.get("synthetic")),
            "participants": int(rows["participantId"].nunique()),
            "followupRows": int(len(rows)),
            "featureSetSizes": {
                name: len(columns)
                for name, columns in prospective_feature_sets(rows).items()
            },
            "previousResultBaseline": previous_result_baseline(rows),
            "modelTrained": False,
            "runtimeEligible": False,
        }
        print(json.dumps(summary, indent=2))
        return
    if args.command == "uci-fetch":
        print(json.dumps(fetch_uci_fertility(), indent=2))
        return
    if args.command == "uci-validate":
        frame = load_uci_fertility()
        print(
            json.dumps(
                {
                    "participants": len(frame),
                    "classCounts": frame["diagnosis"].value_counts().to_dict(),
                },
                indent=2,
            )
        )
        return
    if args.command == "uci-regenerate":
        evaluation = regenerate_uci()
        selected = evaluation["models"][evaluation["selectedModel"]]
        print(
            json.dumps(
                {
                    "selectedModel": evaluation["selectedModel"],
                    "metrics": selected["metrics"],
                    "ninetyPercentTarget": evaluation["ninetyPercentTarget"],
                    "runtimeEligible": evaluation["runtimeEligible"],
                },
                indent=2,
            )
        )
        return
    if args.command == "verify-generated":
        print(json.dumps(verify_generated_reports(), indent=2))
        return
    evaluation = regenerate()
    summary = {
        name: {
            "selected": result["selectedForExport"],
            "promotionGate": result["promotionGate"],
        }
        for name, result in evaluation["featureSets"].items()
    }
    print(json.dumps(summary, indent=2))
