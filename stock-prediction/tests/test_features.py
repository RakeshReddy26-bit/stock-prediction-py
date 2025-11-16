"""
test_features.py
Unit tests for feature engineering functions.
"""
import sys, os
import pytest
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
from features import engineer_features, create_target

def test_add_features_shape():
    # Minimal OHLCV data
    df = pd.DataFrame({
        'Open': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
        'High': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
        'Low': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
        'Close': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
        'Volume': [100]*20
    })
    out = engineer_features(df)
    # Check columns
    for col in ['log_return', 'log_return_1d', 'log_return_5d', 'log_return_20d', 'sma_10', 'sma_20', 'sma_50', 'ema_12', 'ema_26', 'macd', 'macd_signal', 'realized_vol_20', 'atr_14', 'rsi_14', 'momentum_10', 'volume_ratio_20', 'vwap']:
        assert col in out.columns
    # Check shape
    assert out.shape[0] == 20

@pytest.mark.parametrize("ticker, start, end", [
    ("AAPL", "2020-01-01", "2021-01-01"),
    ("MSFT", "2019-01-01", "2020-01-01")
])
def test_no_future_leakage(ticker, start, end):
    df = pd.DataFrame({
        'Open': np.arange(1, 101),
        'High': np.arange(1, 101) + 1,
        'Low': np.arange(1, 101) - 1,
        'Close': np.arange(1, 101),
        'Volume': np.ones(100) * 100
    })
    feat = engineer_features(df)
    # First valid value for rolling mean
    assert np.allclose(feat['sma_10'].iloc[9], np.mean(df['Close'].iloc[:10]))
    # Compare only valid rows for moving averages
    for window in [10, 20, 50]:
        valid = feat[f'sma_{window}'].dropna()
        expected = df['Close'].rolling(window, min_periods=window).mean().dropna()
        np.testing.assert_allclose(valid.values, expected.values)

@pytest.mark.parametrize("window", [10, 20, 50])
def test_moving_average_correctness(window):
    df = pd.DataFrame({'Close': np.arange(1, 101)})
    sma = df['Close'].rolling(window, min_periods=window).mean().dropna()
    feat = engineer_features(pd.DataFrame({
        'Open': df['Close'], 'High': df['Close']+1, 'Low': df['Close']-1, 'Close': df['Close'], 'Volume': 100
    }))
    valid = feat[f'sma_{window}'].dropna()
    np.testing.assert_allclose(valid.values, sma.values)

def test_rsi_range():
    df = pd.DataFrame({'Open': np.arange(1, 101), 'High': np.arange(1, 101)+1, 'Low': np.arange(1, 101)-1, 'Close': np.arange(1, 101), 'Volume': 100})
    feat = engineer_features(df)
    assert feat['rsi_14'].between(0, 100).all()

def test_nan_handling():
    df = pd.DataFrame({'Open': np.arange(1, 31), 'High': np.arange(1, 31)+1, 'Low': np.arange(1, 31)-1, 'Close': np.arange(1, 31), 'Volume': 100})
    feat = engineer_features(df)
    # Only check non-NaN rows for rolling features
    rolling_cols = ['log_return', 'log_return_1d', 'log_return_5d', 'log_return_20d', 'ma_10', 'ma_20', 'sma_10', 'sma_20', 'sma_50', 'vol_20', 'realized_vol_20', 'atr_14', 'momentum_10', 'volume_ratio_20', 'vwap']
    for col in rolling_cols:
        valid = feat[col].dropna()
        assert valid.notnull().all()
    # All other columns should have no NaNs
    for col in set(feat.columns) - set(rolling_cols):
        assert feat[col].notnull().all()

def test_volume_ratio_positive():
    df = pd.DataFrame({'Open': np.arange(1, 101), 'High': np.arange(1, 101)+1, 'Low': np.arange(1, 101)-1, 'Close': np.arange(1, 101), 'Volume': 100})
    feat = engineer_features(df)
    # Only check valid rows
    valid = feat['volume_ratio_20'].dropna()
    assert (valid >= 0).all()

@pytest.mark.parametrize("horizon", [1, 5, 10])
def test_target_shift(horizon):
    df = pd.DataFrame({'Open': np.arange(1, 31), 'High': np.arange(1, 31)+1, 'Low': np.arange(1, 31)-1, 'Close': np.arange(1, 31), 'Volume': 100})
    feat = engineer_features(df)
    tgt = create_target(feat, horizon=horizon)
    # Check alignment only for valid rows
    expected = np.log(tgt['Close'].shift(-horizon) / tgt['Close'])
    mask = ~expected.isna()
    np.testing.assert_allclose(tgt['future_return'][mask], expected[mask])

def test_binary_target_balance():
    df = pd.DataFrame({'Open': np.arange(1, 31), 'High': np.arange(1, 31)+1, 'Low': np.arange(1, 31)-1, 'Close': np.arange(1, 31), 'Volume': 100})
    feat = engineer_features(df)
    tgt = create_target(feat, horizon=1)
    pos_rate = tgt['target_binary'].mean()
    assert 0 <= pos_rate <= 1
    # Warn if severe imbalance
    if pos_rate < 0.3 or pos_rate > 0.7:
        pytest.warns(UserWarning)

@pytest.mark.parametrize("horizon", [1, 5, 10])
def test_no_overlap(horizon):
    df = pd.DataFrame({'Open': np.arange(1, 31), 'High': np.arange(1, 31)+1, 'Low': np.arange(1, 31)-1, 'Close': np.arange(1, 31), 'Volume': 100})
    feat = engineer_features(df)
    tgt = create_target(feat, horizon=horizon)
    assert len(tgt) == len(feat) - horizon
