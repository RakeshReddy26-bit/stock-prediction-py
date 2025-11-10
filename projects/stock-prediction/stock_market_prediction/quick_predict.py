#!/usr/bin/env python3
import argparse
import json
import sys
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

try:
    import yfinance as yf
except Exception as e:
    print(json.dumps({"ok": False, "error": f"yfinance import failed: {e}"}))
    sys.exit(1)


def _last(series: pd.Series):
    return series.iloc[-1] if len(series) else np.nan


def _to_float(x):
    # Normalize scalars from pandas/numPy to python float or None
    try:
        if isinstance(x, pd.Series):
            x = _last(x)
        if x is None or (isinstance(x, float) and np.isnan(x)):
            return None
        if pd.isna(x):  # handles pandas NA, NaT
            return None
        return float(x)
    except Exception:
        return None


def compute_indicators(close: pd.Series):
    if len(close) < 5:
        last_close = _to_float(_last(close))
        return last_close, None, None, last_close
    sma5_s = close.rolling(window=5).mean()
    sma20_s = close.rolling(window=20).mean()
    sma5 = _to_float(_last(sma5_s))
    sma20 = _to_float(_last(sma20_s))
    last_close = _to_float(_last(close))
    pred = sma5 if sma5 is not None else last_close
    return last_close, sma5, sma20, pred


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--ticker', default='AAPL')
    parser.add_argument('--period', default='6mo')
    parser.add_argument('--interval', default='1d')
    args = parser.parse_args()

    try:
        df = yf.download(args.ticker, period=args.period, interval=args.interval, progress=False, auto_adjust=True)
        if df.empty or 'Close' not in df.columns:
            raise RuntimeError('No data returned from yfinance')
        last_close, sma5, sma20, pred = compute_indicators(df['Close'])
        out = {
            'ok': True,
            'ticker': str(args.ticker).upper(),
            'period': args.period,
            'interval': args.interval,
            'last_close': last_close,
            'sma5': sma5,
            'sma20': sma20,
            'prediction_next': pred,
            'as_of': df.index[-1].strftime('%Y-%m-%d')
        }
        print(json.dumps(out))
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))
        sys.exit(2)


if __name__ == '__main__':
    main()
