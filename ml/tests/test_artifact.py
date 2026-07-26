import json
from pathlib import Path

from jsonschema import Draft202012Validator

from preseed_ml.artifact import build_artifact, write_json
from preseed_ml.dataset import load_visem
from preseed_ml.modeling import evaluate_feature_set
from preseed_ml.reporting import model_card

FIXTURES = Path(__file__).parent / "fixtures"


def test_json_output_canonicalizes_cross_platform_float_noise(tmp_path: Path) -> None:
    first = tmp_path / "first.json"
    second = tmp_path / "second.json"
    write_json({"probability": 0.12077994729305393}, first)
    write_json({"probability": 0.12077994729305394}, second)
    assert first.read_bytes() == second.read_bytes()
    assert json.loads(first.read_text())["probability"] == 0.120779947293


def test_artifact_and_model_card_are_complete() -> None:
    joined = load_visem(FIXTURES, require_85=False)
    reports = {
        feature_set: evaluate_feature_set(
            joined,
            feature_set,
            outer_splits=3,
            outer_repeats=1,
            inner_splits=2,
            bootstrap_iterations=50,
            seed=17,
        )
        for feature_set in ("core", "core+hormones")
    }
    artifact = build_artifact(joined, reports)
    schema_path = Path(__file__).parents[1] / "schemas" / "model-artifact.schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    Draft202012Validator(schema).validate(artifact)
    assert artifact["researchOnly"] is True
    assert artifact["commercialUsePermitted"] is False
    assert artifact["dataset"]["doi"] == "10.5281/zenodo.2640506"
    assert len(artifact["models"]) == 2
    for model in artifact["models"]:
        assert "evaluation" in model
        if "linearModel" in model:
            assert len(model["linearModel"]["coefficients"]) == len(model["orderedFeatures"])
            assert model["researchInterval80"]["clinicalConfidenceInterval"] is False
    card = model_card(artifact, reports)
    for required in (
        "research-only",
        "progressive motility",
        "Promotion gate",
        "Uncertainty",
        "Limitations",
        "Ethical and safety constraints",
        "CC BY-NC 4.0",
    ):
        assert required in card
