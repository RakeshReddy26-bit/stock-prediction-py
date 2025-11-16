"""
features.py
Feature engineering for financial time series.

Example usage:
    from .features import engineer_features
    df_feat = engineer_features(df)
"""

import pandas as pd
import numpy as np
import warnings


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer look-back only features for financial ML. No forward-looking bias.
    Args:
        df: DataFrame with columns ['Open', 'High', 'Low', 'Close', 'Volume']
    Returns:
        DataFrame with OHLCV + engineered features.
    """
    if not set(['Open', 'High', 'Low', 'Close', 'Volume']).issubset(df.columns):
        raise ValueError(
            "Input DataFrame must contain columns: Open, High, Low, Close, Volume"
        )
    df = df.copy()
    # Returns
    df['log_return'] = np.log(df['Close'] / df['Close'].shift(1))
    df['log_return_1d'] = df['log_return']
    df['log_return_5d'] = np.log(df['Close'] / df['Close'].shift(5))
    df['log_return_20d'] = np.log(
        df['Close'] / df['Close'].shift(20)
    )
    # Moving averages (min_periods=window for correct alignment)
    df['sma_10'] = df['Close'].rolling(10, min_periods=10).mean()
    df['sma_20'] = df['Close'].rolling(20, min_periods=20).mean()
    df['sma_50'] = df['Close'].rolling(50, min_periods=50).mean()
    # Add aliases for test compatibility
    df['ma_10'] = df['sma_10']
    df['ma_20'] = df['sma_20']
    df['ema_12'] = df['Close'].ewm(span=12, adjust=False).mean()
    df['ema_26'] = df['Close'].ewm(span=26, adjust=False).mean()
    df['macd'] = df['ema_12'] - df['ema_26']
    df['macd_signal'] = df['macd'].ewm(
        span=9,
        adjust=False
    ).mean()
    # Volatility
    df['realized_vol_20'] = (
        df['log_return'].rolling(20, min_periods=20).std() * np.sqrt(252)
    )
    df['vol_20'] = df['realized_vol_20']
    # ATR (Average True Range)
    high_low = df['High'] - df['Low']
    high_close = pd.Series(np.abs(df['High'] - df['Close'].shift(1)), index=df.index)
    low_close = pd.Series(np.abs(df['Low'] - df['Close'].shift(1)), index=df.index)
    tr = pd.concat([
        high_low,
        high_close,
        low_close
    ], axis=1).max(axis=1)
    df['atr_14'] = tr.rolling(14, min_periods=14).mean()
    # Momentum
    delta = df['Close'].diff()
    gain = delta.where(delta > 0, 0)
    gain = gain.rolling(14, min_periods=14).mean()
    loss = -delta.where(delta < 0, 0)
    loss = loss.rolling(14, min_periods=14).mean()
    rs = gain / (loss.replace(0, np.nan))
    df['rsi_14'] = 100 - (100 / (1 + rs))
    df['rsi_14'] = df['rsi_14'].fillna(50)
    df['momentum_10'] = df['Close'] / df['Close'].shift(10) - 1
    # Volume
    df['volume_ratio_20'] = (
        df['Volume'] / df['Volume'].rolling(20, min_periods=20).mean()
    )
    df['vwap'] = (
        (df['Volume'] * (df['High'] + df['Low'] + df['Close']) / 3)
        .rolling(20, min_periods=20).sum()
    ) / (
        df['Volume'].rolling(20, min_periods=20).sum()
    )
    # Do not drop NaN rows; keep shape for tests
    return df


def create_target(
    df: pd.DataFrame,
    horizon: int = 1,
    threshold: float = 0.0,
    task: str = 'classification'
) -> pd.DataFrame:
    """
    Create target variables for financial prediction.
    Args:
        df: DataFrame with features and OHLCV.
        horizon: Number of days ahead for forward return.
        threshold: Threshold for binary classification.
        task: 'classification' or 'regression'.
    Returns:
        DataFrame with target columns added.
    """
    df = df.copy()
    df['future_return'] = np.log(
        df['Close'].shift(-horizon) / df['Close']
    )
    if task == 'classification':
        df['target_binary'] = (
            df['future_return'] > threshold
        ).astype(int)
        # Only calculate pos_rate on valid rows (exclude last horizon rows)
        valid = (
            df['target_binary'][:-horizon]
            if horizon > 0 else df['target_binary']
        )
        pos_rate = valid.mean()
        if pos_rate < 0.3 or pos_rate > 0.7:
            warnings.warn(
                f"Severe class imbalance: positive rate = {pos_rate:.2f}"
            )
    elif task == 'regression':
        df['target_regression'] = df['future_return']
    else:
        raise ValueError(
            "task must be 'classification' or 'regression'"
        )
    # Drop last horizon rows (no future data)
    if horizon > 0:
        df = df.iloc[:-horizon]
    return df


# Unit test
if __name__ == "__main__":
    # Known sequence test
    test_df = pd.DataFrame({
        'Open': np.arange(1, 31),
        'High': np.arange(1, 31) + 1,
        'Low': np.arange(1, 31) - 1,
        'Close': np.arange(1, 31),
        'Volume': np.ones(30) * 100
    })
    out = engineer_features(test_df)
    assert 'log_return_1d' in out.columns
    assert 'macd' in out.columns
    assert 'atr_14' in out.columns
    assert 'rsi_14' in out.columns
    assert 'vwap' in out.columns
    print("All feature columns present. Shape:", out.shape)

    # Plotting example (requires valid backtest_results and predictions)
    # plot_backtest_results(backtest_results, predictions, recession_periods=[('2008-09-01', '2009-06-01')])
