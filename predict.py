#!/usr/bin/env python3
import os, sys, json, argparse, joblib, yfinance as yf, pandas as pd, numpy as np

def normalize_df_cols(df):
    new_cols = []
    for c in df.columns:
        if isinstance(c, tuple):
            new_cols.append("_".join([str(x) for x in c if x is not None and str(x) != ""]))
        else:
            new_cols.append(str(c))
    df.columns = new_cols
    if "Close" not in df.columns:
        for c in list(df.columns):
            lc = c.lower()
            if lc == "close" or "close" in lc or lc.endswith("_close") or lc.startswith("close_"):
                df = df.rename(columns={c: "Close"})
                break
    return df

def build_features(df):
    df = df.copy()
    for lag in range(1,6):
        df[f"lag_{lag}"] = df["Close"].shift(lag)
    df["ret_1"] = df["Close"].pct_change(1)
    df["ret_5"] = df["Close"].pct_change(5)
    df["ma_5"] = df["Close"].rolling(5).mean()
    df["ma_10"] = df["Close"].rolling(10).mean()
    df = df.dropna()
    return df

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--ticker", "-t", required=True, help="Ticker symbol")
    p.add_argument("--period", default="90d", help="yfinance period (default 90d)")
    p.add_argument("--model", default=None, help="Path to model file (defaults to models/<TICKER>_rf.joblib)")
    args = p.parse_args()

    ticker = args.ticker.upper()
    model_path = args.model or f"models/{ticker}_rf.joblib"
    if not os.path.exists(model_path):
        print(json.dumps({"error": "model_not_found", "model_path": model_path}), file=sys.stderr)
        sys.exit(2)

    model = joblib.load(model_path)
    df = yf.download(ticker, period=args.period, interval="1d", progress=False, threads=False)
    if df is None or df.empty:
        print(json.dumps({"error": "no_data", "ticker": ticker}), file=sys.stderr)
        sys.exit(3)

    df = normalize_df_cols(df)
    df.index = pd.to_datetime(df.index)

    if "Close" not in df.columns:
        print(json.dumps({"error": "no_close_column", "columns": list(df.columns)}), file=sys.stderr)
        sys.exit(4)

    df = build_features(df)
    if df.shape[0] == 0:
        print(json.dumps({"error": "not_enough_rows_after_features"}), file=sys.stderr)
        sys.exit(5)

    X = df[[c for c in df.columns if c.startswith("lag_") or c.startswith("ret_") or c.startswith("ma_")]]
    pred = float(model.predict(X.tail(1))[0])
    out = {
        "ticker": ticker,
        "last_close": float(df["Close"].iloc[-1]),
        "pred_next_close": pred,
        "rows_used": int(len(X))
    }
    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    main()
