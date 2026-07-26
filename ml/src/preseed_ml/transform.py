from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike, NDArray


def bounded_logit(percent: ArrayLike) -> NDArray[np.float64]:
    """Map a percentage in [0, 100] to the real line without infinite endpoints."""
    values = np.asarray(percent, dtype=float)
    if np.any((values < 0) | (values > 100)):
        raise ValueError("Progressive motility must be between 0 and 100 percent.")
    probability = (values + 0.5) / 101.0
    return np.log(probability / (1.0 - probability))


def inverse_bounded_logit(transformed: ArrayLike) -> NDArray[np.float64]:
    """Invert bounded_logit and defensively constrain the reported result."""
    values = np.asarray(transformed, dtype=float)
    probability = 1.0 / (1.0 + np.exp(-values))
    return np.clip(101.0 * probability - 0.5, 0.0, 100.0)
