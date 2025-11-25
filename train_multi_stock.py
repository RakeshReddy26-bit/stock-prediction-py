#!/usr/bin/env python3
"""
train_multi_stock.py
Simple per-ticker training pipeline using RandomForest.
Saves models to models/{TICKER}_rf.joblib and a JSON report in reports/.
"""
import os
import json
import time
from datetime import datetime, timedelta
import traceback

import pandas as pd
import numpy as np
import yfinance as yf
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import joblib
from pydantic import BaseModel

ROOT = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(ROOT, "models")
REPORTS_DIR = os.path.join(ROOT, "reports")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

LOG_PREFIX = f"[train_multi_stock {datetime.utcnow().isoformat()}]"

def log(*args, **kwargs):
    print(LOG_PREFIX, *args, **kwargs)

def load_tickers_from_csv(path="stock_data.csv"):
    if os.path.exists(path):
        try:
            df = pd.read_csv(path)
            # try to find a column named Ticker or ticker
            for name in ("Ticker", "ticker", "symbol", "Symbol"):
                if name in df.columns:
                    tickers = df[name].dropna().unique().tolist()
                    if tickers:
                        return [t.strip() for t in tickers if isinstance(t, str)]
        except Exception:
            log("Failed reading stock_data.csv:", traceback.format_exc())
    # fallback list
    return ["AAPL", "MSFT", "GOOG", "AMZN", "TSLA"]

def download_history(ticker, period="2y", interval="1d"):
    log("Downloading", ticker, "period", period)
    try:
        df = yf.download(ticker, period=period, interval=interval, progress=False, threads=False)
        if df is None or df.empty:
            return None
        df = df[["Open","High","Low","Close","Volume"]].copy()
        df.index = pd.to_datetime(df.index)
        return df
    except Exception:
        log("Download failed:", ticker, traceback.format_exc())
        return None

def make_features(df, n_lags=5):
    df = df.copy()

    # Normalize column names to strings (handle tuples / MultiIndex)
    new_cols = []
    for c in df.columns:
        if isinstance(c, tuple):
            new_cols.append("_".join([str(x) for x in c if x is not None and str(x) != ""]))
        else:
            new_cols.append(str(c))
    df.columns = new_cols

    # ensure Close exists (try common alternatives and ticker-suffixed column names)
    if "Close" not in df.columns:
        # common alternative names
        for alt in ("close", "Adj Close", "Adj_Close", "adjclose", "AdjClose"):
            if alt in df.columns:
                df = df.rename(columns={alt: "Close"})
                break

    # if still missing, try to find columns that contain/ start with 'Close' or are like 'Close_<TICKER>'
    if "Close" not in df.columns:
        for c in list(df.columns):
            lc = c.lower()
            # handle 'Close', 'Close_TICKER', 'TICKER_Close', 'close', etc.
            if lc == "close" or lc.startswith("close") or lc.endswith("_close") or lc.split("_")[0] == "close" or "close" in lc:
                df = df.rename(columns={c: "Close"})
                break

    if "Close" not in df.columns:
        raise ValueError("DataFrame missing Close after column normalization. Columns: %r" % (list(df.columns),))

    # Create lag features and rolling stats
    for lag in range(1, n_lags + 1):
        df[f"lag_{lag}"] = df["Close"].shift(lag)

    df["ret_1"] = df["Close"].pct_change(1)
    df["ret_5"] = df["Close"].pct_change(5)
    df["ma_5"] = df["Close"].rolling(5).mean()
    df["ma_10"] = df["Close"].rolling(10).mean()

    # target: next day close
    df["target_next_close"] = df["Close"].shift(-1)
    df = df.dropna()

    return df

def train_for_ticker(ticker, df):
    try:
        df_feat = make_features(df)
        X = df_feat[[c for c in df_feat.columns if c.startswith("lag_") or c.startswith("ret_") or c.startswith("ma_")]]
        y = df_feat["target_next_close"]
        if len(X) < 50:
            log("Not enough data for", ticker, "samples:", len(X))
            return {"ticker": ticker, "trained": False, "reason": "not_enough_data", "samples": len(X)}

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, shuffle=False)
        model = RandomForestRegressor(n_estimators=100, n_jobs=-1, random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        model_path = os.path.join(MODELS_DIR, f"{ticker}_rf.joblib")
        joblib.dump(model, model_path)
        log("Saved model for", ticker, "->", model_path)
        return {"ticker": ticker, "trained": True, "rmse": rmse, "samples": int(len(X))}
    except Exception:
        log("Training failed for", ticker, traceback.format_exc())
        return {"ticker": ticker, "trained": False, "reason": "exception", "exception": traceback.format_exc()}

class PredictResponse(BaseModel):
    model_config = {'protected_namespaces': ()}   # add this line
    ticker: str
    last_close: float
    pred_next_close: float
    rows_used: int
    model_: str   # instead of model_path

def main():
    start = time.time()
    tickers = load_tickers_from_csv()
    log("Tickers:", tickers)
    report = {"timestamp": datetime.utcnow().isoformat(), "results": []}
    for ticker in tickers:
        # try to find local CSV file first (e.g., data/{ticker}.csv)
        local_paths = [
            os.path.join(ROOT, f"data/{ticker}.csv"),
            os.path.join(ROOT, f"{ticker}.csv"),
        ]
        df = None
        for p in local_paths:
            if os.path.exists(p):
                try:
                    df = pd.read_csv(p, index_col=0, parse_dates=True)
                    log("Loaded local data for", ticker, "from", p)
                    break
                except Exception:
                    log("Failed loading local file", p, traceback.format_exc())
        if df is None:
            df = download_history(ticker)
        if df is None or df.empty:
            log("No data for", ticker)
            report["results"].append({"ticker": ticker, "trained": False, "reason": "no_data"})
            continue
        res = train_for_ticker(ticker, df)
        report["results"].append(res)

    report["duration_seconds"] = time.time() - start
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    report_path = os.path.join(REPORTS_DIR, f"training_{ts}.json")
    with open(report_path, "w") as fh:
        json.dump(report, fh, indent=2)
    log("Training finished. Report:", report_path)
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
