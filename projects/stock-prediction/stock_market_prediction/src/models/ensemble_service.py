from __future__ import annotations
import os
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

from ..core import predict_stock as predict_rf, _load_data, _rsi
from .xgb_service import predict_stock_xgb, evaluate_stock_xgb
from .lstm_service import predict_stock_lstm, predict_stock_lstm_tuned, evaluate_stock_lstm
from .arima_service import predict_stock_arima, evaluate_stock_arima
from .transformer_service import predict_stock_transformer, evaluate_stock_transformer


def _rmse_from_payload(payload: Dict) -> float:
    # Prefer price-scale RMSE if present in versioned metrics strings; otherwise estimate from intervals
    # Many payloads include intervals computed via 1.96*rmse; infer rmse from first interval width
    if payload is None:
        return float('inf')
    metrics = payload.get('metrics') if isinstance(payload.get('metrics'), dict) else None
    if metrics:
        for k in ['val_rmse_price', 'rmse']:
            if k in metrics and metrics[k] is not None:
                try:
                    return float(metrics[k])
                except Exception:
                    pass
    intervals = payload.get('intervals') or []
    if intervals:
        lo, hi = intervals[0]
        try:
            return abs((hi - lo) / (2 * 1.96))
        except Exception:
            return float('inf')
    return float('inf')


def predict_stock_ensemble(ticker: str, days: int = 30) -> Dict:
    ticker = ticker.upper().strip()
    # Collect model predictions (skip failures)
    preds_list: List[Tuple[str, Dict]] = []
    for name, fn in [
        ('rf', lambda: predict_rf(ticker, days)),
        ('xgb', lambda: predict_stock_xgb(ticker, days)),
        ('lstm', lambda: predict_stock_lstm(ticker, days)),
        ('lstm_tuned', lambda: predict_stock_lstm_tuned(ticker, days)),
        ('arima', lambda: predict_stock_arima(ticker, days)),
        ('transformer', lambda: predict_stock_transformer(ticker, days)),
    ]:
        try:
            out = fn()
            if not out or not isinstance(out.get('predictions'), list) or len(out['predictions']) == 0:
                continue
            preds_list.append((name, out))
        except Exception:
            continue

    if not preds_list:
        raise RuntimeError('No base models available for ensemble')

    # Align lengths to the minimum length across models
    min_len = min(len(p[1]['predictions']) for p in preds_list)
    if min_len < days:
        days = min_len
    preds_arr = []
    weights = []
    model_weights = {}
    for name, out in preds_list:
        rmse = _rmse_from_payload(out)
        w = 1.0 / (rmse + 1e-6) if np.isfinite(rmse) and rmse > 0 else 1e-3
        model_weights[name] = w
        weights.append(w)
        preds_arr.append(np.array(out['predictions'][:days], dtype=float))
    weights = np.array(weights, dtype=float)
    weights = weights / weights.sum() if weights.sum() > 0 else np.ones_like(weights) / len(weights)
    # Weighted average predictions
    stacked = np.vstack(preds_arr)  # (n_models, days)
    ens_pred = (weights[:, None] * stacked).sum(axis=0)

    # Confidence intervals: use weighted average of per-model RMSE as band
    rmses = []
    for _, out in preds_list:
        rmses.append(_rmse_from_payload(out))
    rmses = np.array([r for r in rmses if np.isfinite(r)], dtype=float)
    avg_rmse = float((weights[:len(rmses)] * rmses).sum()) if len(rmses) else 0.0
    ci = 1.96 * avg_rmse
    intervals = [[float(p - ci), float(p + ci)] for p in ens_pred.tolist()]

    # Aggregate optional insights from models
    up_probs = []
    risks = []
    for name, out in preds_list:
        if 'up_prob' in out and isinstance(out['up_prob'], (int, float)):
            up_probs.append(float(out['up_prob']))
        if 'risk_score' in out and isinstance(out['risk_score'], (int, float)):
            risks.append(float(out['risk_score']))
    up_prob_ens = float(np.clip(np.average(up_probs, weights=None) if up_probs else 0.5, 0.0, 1.0))
    risk_score_ens = float(np.clip(np.average(risks, weights=None) if risks else 50.0, 0.0, 100.0))

    # Enrich with indicators
    df = _load_data(ticker, period='5y')
    sma5 = df['Close'].rolling(5).mean().iloc[-1]
    sma20 = df['Close'].rolling(20).mean().iloc[-1]
    rsi14 = _rsi(df['Close'], 14).iloc[-1]

    # Normalize weights for reporting
    denom = sum(model_weights.values()) or 1.0
    model_weights = {k: float(v / denom) for k, v in model_weights.items()}

    return {
        'ticker': ticker,
        'predictions': [float(x) for x in ens_pred.tolist()],
        'intervals': intervals,
        'confidence': float(np.clip(1.0 - (avg_rmse / (np.mean(df['Close']) or 1)), 0, 1)),
    'up_prob': up_prob_ens,
    'risk_score': risk_score_ens,
        'model_version': 'ensemble_v1',
        'timestamp': pd.Timestamp.utcnow().isoformat(),
        'as_of': df.index[-1].isoformat(),
        'last_close': float(df['Close'].iloc[-1]),
        'sma5': float(sma5) if pd.notna(sma5) else None,
        'sma20': float(sma20) if pd.notna(sma20) else None,
        'rsi14': float(rsi14) if pd.notna(rsi14) else None,
        'models_used': [name for name, _ in preds_list],
        'weights': model_weights,
    }


def evaluate_stock_ensemble(ticker: str) -> Dict:
    # Combine available backtests using RMSE-based weights; directional acc averaged.
    parts: List[Tuple[str, Dict]] = []
    for name, fn in [
        ('rf', None),  # rf is evaluated via API core; skip here
        ('xgb', lambda: evaluate_stock_xgb(ticker)),
        ('lstm', lambda: evaluate_stock_lstm(ticker, tuned=False)),
        ('lstm_tuned', lambda: evaluate_stock_lstm(ticker, tuned=True)),
        ('arima', lambda: evaluate_stock_arima(ticker)),
        ('transformer', lambda: evaluate_stock_transformer(ticker)),
    ]:
        if fn is None:
            continue
        try:
            parts.append((name, fn()))
        except Exception:
            continue
    if not parts:
        raise RuntimeError('No base backtests available for ensemble evaluation')
    # Compute weights from RMSE
    weights = []
    accs = []
    for name, out in parts:
        rmse = float(out.get('test_metrics', {}).get('rmse', np.inf))
        w = 1.0 / (rmse + 1e-6) if np.isfinite(rmse) and rmse > 0 else 1e-3
        weights.append(w)
        accs.append(float(out.get('test_metrics', {}).get('accuracy', 0.0)))
    weights = np.array(weights)
    weights = weights / weights.sum() if weights.sum() > 0 else np.ones_like(weights) / len(weights)
    # Weighted RMSE approximation (harmonic-like): 1/sum(w) with w=1/rmse -> approx weighted average
    rmses = np.array([float(out.get('test_metrics', {}).get('rmse', np.inf)) for _, out in parts])
    rmse_w = float(np.sum(weights * rmses))
    mae_w = float(np.sum(weights * np.array([float(out.get('test_metrics', {}).get('mae', np.inf)) for _, out in parts])))
    acc_w = float(np.sum(weights * np.array(accs)))
    # baselines averaged
    def _avg_baseline(key: str) -> Dict:
        vals = []
        for _, out in parts:
            b = out.get('baseline', {}).get(key)
            if b:
                vals.append((float(b.get('rmse', np.nan)), float(b.get('mae', np.nan))))
        if not vals:
            return {}
        arr = np.array(vals)
        return { 'rmse': float(np.nanmean(arr[:,0])), 'mae': float(np.nanmean(arr[:,1])) }

    return {
        'ticker': ticker.upper(),
        'test_metrics': {'rmse': rmse_w, 'mae': mae_w, 'accuracy': acc_w},
        'baseline': { 'naive': _avg_baseline('naive'), 'sma5': _avg_baseline('sma5') },
        'timestamp': pd.Timestamp.utcnow().isoformat(),
    }
