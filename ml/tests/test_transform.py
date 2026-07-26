import numpy as np
import pytest

from preseed_ml.transform import bounded_logit, inverse_bounded_logit


def test_bounded_logit_round_trip_including_endpoints() -> None:
    original = np.asarray([0.0, 1.0, 50.0, 99.0, 100.0])
    recovered = inverse_bounded_logit(bounded_logit(original))
    np.testing.assert_allclose(recovered, original, atol=1e-10)
    assert np.all((recovered >= 0) & (recovered <= 100))


def test_invalid_target_is_rejected() -> None:
    with pytest.raises(ValueError):
        bounded_logit([-1])
    with pytest.raises(ValueError):
        bounded_logit([101])
