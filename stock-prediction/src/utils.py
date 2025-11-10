"""
utils.py
Helper functions for financial ML workflows.
"""

from typing import Tuple, Generator
import pandas as pd
import numpy as np

def time_series_split(X: pd.DataFrame, y: pd.Series, n_splits: int = 5) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
    """
    Time-series (expanding window) split for walk-forward validation.
    Args:
        X: Feature DataFrame.
        y: Target Series.
        n_splits: Number of splits.
    Returns:
        Generator of train/test indices.
    """
    fold_size = len(X) // n_splits
    for i in range(n_splits):
        train_end = (i + 1) * fold_size
        test_start = train_end
        test_end = test_start + fold_size
        if i == n_splits - 1:
            train_end = len(X) - fold_size
            test_start = train_end
            test_end = len(X)
        train_idx = np.arange(0, train_end)
        test_idx = np.arange(test_start, min(test_end, len(X)))
        if len(test_idx) == 0:
            continue
        yield train_idx, test_idx
