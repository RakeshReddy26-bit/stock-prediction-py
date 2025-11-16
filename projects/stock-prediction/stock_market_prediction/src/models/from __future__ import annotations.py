from __future__ import annotations
import os, json, hashlib
from datetime import datetime
from typing import Dict, Tuple, Union

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error
from tensorflow.keras import Sequential
from tensorflow.keras.layers import LSTM, Dropout, Dense
from tensorflow.keras.optimizers import Adam

def _create_sequences(arr: np.ndarray, lookback: int) -> Tuple[np.ndarray, np.ndarray]:
    X, y = [], []
    for i in range(lookback, len(arr)):
        X.append(arr[i - lookback:i, 0])
        y.append(arr[i, 0])
    X = np.array(X).reshape(-1, lookback, 1)
    y = np.array(y)
    return X, y

def _metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    yt, yp = y_true.flatten(), y_pred.flatten()
    denom = np.where(yt == 0, np.nan, np.abs(yt))
    mape = float(np.nanmean(np.abs((yt - yp) / denom) * 100.0))
    da = float(np.mean(np.sign(np.diff(yt)) == np.sign(np.diff(yp)))) if len(yt) > 1 else 0.0
    return {"rmse": rmse, "mae": mae, "mape": mape, "directional_accuracy": da}

def train_model(
    close_prices: Union[pd.Series, np.ndarray],
    lookback: int = 60,
    epochs: int = 5,
    batch_size: int = 32,
    models_dir: str = "models",
) -> Dict:
    """
    Trains an LSTM on a sequence of closing prices and saves artifacts.

    Args:
      close_prices: 1D pd.Series or np.ndarray of floats (chronological order).
      lookback: timesteps per input window.
      epochs: training epochs.
      batch_size: batch size.
      models_dir: directory to write model and bundle.

    Returns:
      dict with metrics, paths, and bundle info.
    """
    os.makedirs(models_dir, exist_ok=True)

    # Prepare data
    values = np.asarray(close_prices, dtype=float).reshape(-1, 1)
    if values.shape[0] <= lookback + 1:
        raise ValueError(f"Need > {lookback+1} points, got {values.shape[0]}")

    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler.fit_transform(values)
    X, y = _create_sequences(scaled, lookback)

    split = int(len(X) * 0.8) if len(X) > 100 else max(1, len(X) - max(10, lookback))
    X_tr, y_tr, X_val, y_val = X[:split], y[:split], X[split:], y[split:]
    if len(X_val) == 0:
        # ensure we have a validation slice
        X_tr, y_tr, X_val, y_val = X[:-1], y[:-1], X[-1:], y[-1:]

    # Model
    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=(lookback, 1)),
        Dropout(0.2),
        LSTM(50, return_sequences=True),
        Dropout(0.2),
        LSTM(50),
        Dropout(0.2),
        Dense(1),
    ])
    model.compile(optimizer=Adam(learning_rate=0.001), loss="mean_squared_error", metrics=["mae"])

    history = model.fit(
        X_tr, y_tr, epochs=epochs, batch_size=batch_size,
        validation_data=(X_val, y_val), verbose=1
    )

    # Evaluate (inverse scale)
    y_val_pred = model.predict(X_val, verbose=0)
    y_val_true_inv = scaler.inverse_transform(y_val.reshape(-1, 1))
    y_val_pred_inv = scaler.inverse_transform(y_val_pred)
    metrics = _metrics(y_val_true_inv, y_val_pred_inv)

    # Persist artifacts
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    model_path = os.path.join(models_dir, f"lstm_{ts}.keras")
    model.save(model_path)
    with open(model_path, "rb") as f:
        model_hash = hashlib.sha256(f.read()).hexdigest()[:12]

    bundle = {
        "model_path": model_path,
        "scaler_min_": scaler.min_.tolist(),
        "scaler_scale_": scaler.scale_.tolist(),
        "lookback": lookback,
        "created_at": ts,
        "hash": model_hash,
    }
    bundle_path = os.path.join(models_dir, f"model_{ts}_{model_hash}.json")
    with open(bundle_path, "w") as f:
        json.dump(bundle, f)

    return {
        "metrics_val": metrics,
        "epochs": epochs,
        "lookback": lookback,
        "history": {
            "loss": [float(x) for x in history.history.get("loss", [])],
            "val_loss": [float(x) for x in history.history.get("val_loss", [])],
            "mae": [float(x) for x in history.history.get("mae", [])],
            "val_mae": [float(x) for x in history.history.get("val_mae", [])],
        },
        "artifacts": {"model_path": model_path, "bundle_path": bundle_path, "hash": model_hash},
        "timestamp": ts,