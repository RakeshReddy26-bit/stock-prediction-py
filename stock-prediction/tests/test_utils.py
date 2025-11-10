"""
test_utils.py
Unit tests for time-series split function.
"""
import sys, os
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from utils import time_series_split

def test_time_series_split():
    X = pd.DataFrame({'a': np.arange(20)})
    y = pd.Series(np.arange(20))
    splits = list(time_series_split(X, y, n_splits=4))
    assert len(splits) == 4
    for train_idx, test_idx in splits:
        assert max(train_idx) < min(test_idx)
        assert len(train_idx) > 0
        assert len(test_idx) > 0
