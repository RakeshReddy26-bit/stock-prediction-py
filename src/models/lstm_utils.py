"""Utilities for preparing time-series windows for LSTM models."""
from __future__ import annotations

import numpy as np
from typing import Tuple


def windowed_sequences(X: np.ndarray, window_size: int, horizon: int = 1) -> Tuple[np.ndarray, np.ndarray]:
    """Convert a 2D array (n_samples, n_features) into LSTM-ready windows.

    Returns (X_windows, y) where X_windows has shape (n_windows, window_size, n_features)
    and y has shape (n_windows,) or (n_windows, n_targets).
    """
    if X.ndim == 1:
        X = X.reshape(-1, 1)
    n_samples, n_features = X.shape
    if window_size < 1:
        raise ValueError('window_size must be >= 1')
    if horizon < 1:
        raise ValueError('horizon must be >= 1')

    windows = []
    targets = []
    for start in range(0, n_samples - window_size - horizon + 1):
        end = start + window_size
        windows.append(X[start:end])
        targets.append(X[end + horizon - 1])

    Xw = np.stack(windows, axis=0) if windows else np.empty((0, window_size, n_features))
    y = np.stack(targets, axis=0) if targets else np.empty((0, n_features))
    # if target is single feature, return 1D y
    if y.shape[1] == 1:
        y = y.ravel()
    return Xw, y
