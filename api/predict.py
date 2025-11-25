#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import joblib
import yfinance as yf
import pandas as pd
import numpy as np
from typing import Optional

app = FastAPI(title="Stock Prediction API", version="0.1")

def normalize_df_cols(df: pd.DataFrame) -> pd.DataFrame:
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

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for lag in range(1,6):
        df[f"lag_{lag}"] = df["Close"].shift(lag)
    df["ret_1"] = df["Close"].pct_change(1)
    df["ret_5"] = df["Close"].pct_change(5)
    df["ma_5"] = df["Close"].rolling(5).mean()
    df["ma_10"] = df["Close"].rolling(10).mean()
    df = df.dropna()
    return df

class PredictResponse(BaseModel):
    model_config = {'protected_namespaces': ()}

    ticker: str
    last_close: float
    pred_next_close: float
    rows_used: int
    model_path: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/predict", response_model=PredictResponse)
def predict(ticker: str = Query(..., min_length=1),
            period: str = Query("90d"),
            model: Optional[str] = Query(None)):
    ticker = ticker.upper()
    model_path = model or f"models/{ticker}_rf.joblib"
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail=f"model not found: {model_path}")

    try:
        model = joblib.load(model_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed loading model: {e}")

    # Download price history
    try:
        df = yf.download(ticker, period=period, interval="1d", progress=False, threads=False)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"yfinance download error: {e}")

    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="no data downloaded for ticker")

    # normalize columns and build features
    df = df[["Open","High","Low","Close","Volume"]] if set(["Open","High","Low","Close","Volume"]).issubset(df.columns) else df
    df = normalize_df_cols(df)
    if "Close" not in df.columns:
        raise HTTPException(status_code=422, detail={"error": "no_close_column", "columns": list(df.columns)})

    df.index = pd.to_datetime(df.index)

    df = build_features(df)
    if df.shape[0] == 0:
        raise HTTPException(status_code=422, detail={"error": "not_enough_rows_after_features"})

    X = df[[c for c in df.columns if c.startswith("lag_") or c.startswith("ret_") or c.startswith("ma_")]]
    pred = float(model.predict(X.tail(1))[0])
    last_close = float(df["Close"].iloc[-1])
    out = {
        "ticker": ticker,
        "last_close": last_close,
        "pred_next_close": pred,
        "rows_used": int(len(X)),
        "model_path": model_path
    }
    return JSONResponse(status_code=200, content=out)
