"""Lightweight time-series-aware trainer utilities.

Provides:
- `time_series_splits(n_samples, n_splits)` -> yields (train_idx, test_idx) for expanding-window CV
- `train_gradient_booster(X, y, **kwargs)` -> trains an XGBoost classifier if available, otherwise sklearn's GradientBoostingClassifier / RandomForestClassifier
- `save_model` / `load_model` helpers

These helpers are small and intended as scaffolding for the predictive modeling core.
"""
from __future__ import annotations

import os
from typing import Generator, Iterable, Tuple, Any, Optional

import joblib
import numpy as np


def time_series_splits(n_samples: int, n_splits: int = 3) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
    """Yield expanding-window train/test index arrays.

    Example: for n_samples=20, n_splits=3 -> test_size = floor(20/(3+1))=5
    splits:
      split 0: train 0..4, test 5..9
      split 1: train 0..9, test 10..14
      split 2: train 0..14, test 15..19
    """
    if n_splits < 1:
        raise ValueError('n_splits must be >= 1')
    test_size = max(1, n_samples // (n_splits + 1))
    for i in range(n_splits):
        train_end = (i + 1) * test_size
        test_start = train_end
        test_end = test_start + test_size
        # clamp
        test_end = min(test_end, n_samples)
        if train_end <= 0 or test_start >= n_samples:
            break
        train_idx = np.arange(0, train_end)
        test_idx = np.arange(test_start, test_end)
        yield train_idx, test_idx


def train_gradient_booster(X: Iterable, y: Iterable, random_state: int = 42, model_params: dict | None = None, **fit_kwargs) -> Any:
    """Train a gradient boosting binary classifier.

    Prefers `xgboost.XGBClassifier` if installed, otherwise uses sklearn's
    `GradientBoostingClassifier` or `RandomForestClassifier` as fallbacks.
    Returns the fitted model object.
    """
    try:
        import xgboost as xgb  # type: ignore

        params = dict(model_params or {})
        # ensure deterministic seed unless overridden
        params.setdefault('random_state', random_state)
        model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss', **params)
    except Exception:
        # fallback to sklearn's implementations (usually available in dev env)
        try:
            from sklearn.ensemble import GradientBoostingClassifier

            params = dict(model_params or {})
            params.setdefault('random_state', random_state)
            model = GradientBoostingClassifier(**params)
        except Exception:
            try:
                from sklearn.ensemble import RandomForestClassifier
                params = dict(model_params or {})
                params.setdefault('random_state', random_state)
                model = RandomForestClassifier(**params)
            except Exception as e:
                raise ImportError('xgboost or sklearn must be installed to train models') from e

    model.fit(X, y, **fit_kwargs)
    return model


def save_model(model: Any, path: str) -> None:
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    joblib.dump(model, path)


def load_model(path: str) -> Any:
    return joblib.load(path)
