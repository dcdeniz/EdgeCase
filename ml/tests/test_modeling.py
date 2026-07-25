from pathlib import Path

from preseed_ml.dataset import load_visem
from preseed_ml.modeling import candidate_models, evaluate_feature_set

FIXTURES = Path(__file__).parent / "fixtures"


def test_preprocessing_is_inside_each_candidate_pipeline() -> None:
    models = {candidate.name: candidate.estimator for candidate in candidate_models()}
    assert list(models["ridge"].named_steps) == ["imputer", "scaler", "model"]
    assert list(models["elastic_net"].named_steps) == ["imputer", "scaler", "model"]
    assert list(models["shallow_tree"].named_steps) == ["imputer", "model"]


def test_small_fixture_training_is_deterministic() -> None:
    joined = load_visem(FIXTURES, require_85=False)
    kwargs = {
        "outer_splits": 3,
        "outer_repeats": 2,
        "inner_splits": 2,
        "bootstrap_iterations": 100,
        "seed": 42,
    }
    first = evaluate_feature_set(joined, "core", **kwargs)
    second = evaluate_feature_set(joined, "core", **kwargs)
    assert first == second
    assert first["validation"]["preprocessingInsideEachFold"] is True
    assert first["models"]["ridge"]["metrics"]["mae"] < 2
