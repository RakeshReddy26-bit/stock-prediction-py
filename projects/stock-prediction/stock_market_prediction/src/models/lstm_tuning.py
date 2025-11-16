from __future__ import annotations
import numpy as np
import pandas as pd
from typing import Dict, Any
import optuna
from sklearn.preprocessing import StandardScaler
from .lstm_model import LSTMConfig, make_supervised, build_lstm


def time_series_cv_mse(values: np.ndarray, lookback: int, split_ratio: float, cfg_kwargs: Dict[str, Any]) -> float:
    scaler = StandardScaler()
    values_s = scaler.fit_transform(values.reshape(-1,1)).ravel()
    X, y = make_supervised(values_s, lookback)
    if len(X) < 200:
        return float('inf')
    split = int(len(X) * split_ratio)
    X_tr, y_tr = X[:split], y[:split]
    X_va, y_va = X[split:], y[split:]
    X_tr = X_tr[..., None]
    X_va = X_va[..., None]
    cfg = LSTMConfig(**cfg_kwargs)
    model = build_lstm((lookback,1), cfg)
    model.fit(X_tr, y_tr, validation_data=(X_va, y_va), epochs=cfg.epochs, batch_size=cfg.batch_size, verbose=0)
    val = float(model.evaluate(X_va, y_va, verbose=0)) if len(X_va) else 1e9
    return val


def objective_for_series(series: pd.Series) -> optuna.trial.Trial:
    values = series.astype(float).values
    def _objective(trial: optuna.trial.Trial) -> float:
        lookback = trial.suggest_int('lookback', 20, 120, step=10)
        hidden_units = trial.suggest_categorical('hidden_units', [32, 64, 128])
        dropout = trial.suggest_float('dropout', 0.0, 0.5, step=0.1)
        lr = trial.suggest_float('lr', 1e-4, 5e-3, log=True)
        epochs = trial.suggest_int('epochs', 8, 25)
        batch_size = trial.suggest_categorical('batch_size', [32, 64, 128])
        cfg_kwargs = dict(lookback=lookback, hidden_units=hidden_units, dropout=dropout, lr=lr, epochs=epochs, batch_size=batch_size, val_split=0.2)
        return time_series_cv_mse(values, lookback, 0.8, cfg_kwargs)
    return _objective


def tune_lstm(series: pd.Series, n_trials: int = 25, timeout: int | None = None) -> Dict[str, Any]:
    study = optuna.create_study(direction='minimize')
    study.optimize(objective_for_series(series), n_trials=n_trials, timeout=timeout or None, show_progress_bar=False)
    return study.best_params
