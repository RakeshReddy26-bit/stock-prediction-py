from __future__ import annotations
import os
from typing import Dict, Tuple, List

import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler

import torch
import torch.nn as nn

from ..core import _load_data, MODELS_DIR, _rsi


TORCH_DIR = os.path.join(MODELS_DIR, 'transformer')
os.makedirs(TORCH_DIR, exist_ok=True)


def _bundle_path(ticker: str) -> str:
    return os.path.join(TORCH_DIR, f"transformer_{ticker.upper()}.pkl")


class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # (1, max_len, d_model)
        self.register_buffer('pe', pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq_len, d_model)
        seq_len = x.size(1)
        return x + self.pe[:, :seq_len]


class TransformerRegressor(nn.Module):
    def __init__(self, d_model: int = 32, nhead: int = 4, num_layers: int = 2, dropout: float = 0.1):
        super().__init__()
        self.input_proj = nn.Linear(1, d_model)
        encoder_layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead, dim_feedforward=d_model*4, dropout=dropout, batch_first=True)
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.pos = PositionalEncoding(d_model)
        self.head = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.ReLU(),
            nn.Linear(d_model, 1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq_len, 1)
        h = self.input_proj(x)
        h = self.pos(h)
        h = self.encoder(h)
        # take last token
        last = h[:, -1, :]
        out = self.head(last)
        return out  # (batch, 1)


def _make_supervised(values: np.ndarray, lookback: int) -> Tuple[np.ndarray, np.ndarray]:
    X, y = [], []
    for i in range(len(values) - lookback):
        X.append(values[i:i+lookback])
        y.append(values[i+lookback])
    return np.asarray(X), np.asarray(y)


def train_stock_transformer(ticker: str, lookback: int = 60) -> str:
    torch.manual_seed(42)
    np.random.seed(42)

    df = _load_data(ticker, period='5y')
    series = df['Close'].astype(float).replace([np.inf, -np.inf], np.nan).dropna()
    if len(series) < lookback + 100:
        raise RuntimeError('Not enough data for Transformer training')

    scaler = StandardScaler()
    vals = series.values.reshape(-1, 1)
    vals_s = scaler.fit_transform(vals).ravel()
    X, y = _make_supervised(vals_s, lookback)
    split = int(len(X) * 0.8)
    X_tr, y_tr = X[:split], y[:split]
    X_va, y_va = X[split:], y[split:]

    device = torch.device('cpu')
    model = TransformerRegressor(d_model=32, nhead=4, num_layers=2, dropout=0.1).to(device)
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.MSELoss()

    def to_tensor(a):
        return torch.from_numpy(a.astype(np.float32))

    X_tr_t = to_tensor(X_tr)[..., None]  # (N, lookback, 1)
    y_tr_t = to_tensor(y_tr)[:, None]
    X_va_t = to_tensor(X_va)[..., None]
    y_va_t = to_tensor(y_va)[:, None]

    epochs = 30
    batch = 64
    best_val = float('inf')
    patience, wait = 5, 0
    for epoch in range(epochs):
        model.train()
        perm = torch.randperm(X_tr_t.size(0))
        total = 0.0
        for i in range(0, X_tr_t.size(0), batch):
            idx = perm[i:i+batch]
            xb = X_tr_t[idx].to(device)
            yb = y_tr_t[idx].to(device)
            opt.zero_grad()
            pred = model(xb)
            loss = loss_fn(pred, yb)
            loss.backward()
            opt.step()
            total += loss.item() * xb.size(0)
        # val
        model.eval()
        with torch.no_grad():
            val_pred = model(X_va_t.to(device))
            val_loss = loss_fn(val_pred, y_va_t.to(device)).item()
        if val_loss < best_val - 1e-6:
            best_val = val_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            wait = 0
        else:
            wait += 1
            if wait >= patience:
                break

    # load best
    if 'best_state' in locals():
        model.load_state_dict(best_state)

    # compute price-scale metrics on val
    with torch.no_grad():
        val_pred = model(X_va_t.to(device)).cpu().numpy().ravel()
    y_val_price = scaler.inverse_transform(y_va.reshape(-1,1)).ravel()
    y_pred_price = scaler.inverse_transform(val_pred.reshape(-1,1)).ravel()
    val_rmse_price = float(np.sqrt(np.mean((y_pred_price - y_val_price) ** 2)))
    val_mae_price = float(np.mean(np.abs(y_pred_price - y_val_price)))

    ts = pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')
    bundle = {
        'ticker': ticker.upper(),
        'created_at': ts,
        'cfg': {
            'lookback': lookback,
            'd_model': 32,
            'nhead': 4,
            'num_layers': 2,
            'dropout': 0.1,
            'epochs': epochs,
            'batch_size': batch,
            'lr': 1e-3,
        },
        'scaler': scaler,
        'state_dict': {k: v.cpu().numpy() for k, v in model.state_dict().items()},
        'metrics': {
            'val_rmse_price': val_rmse_price,
            'val_mae_price': val_mae_price
        }
    }
    latest = _bundle_path(ticker)
    versioned = os.path.join(TORCH_DIR, f"transformer_{ticker.upper()}_{ts}.pkl")
    joblib.dump(bundle, versioned)
    joblib.dump(bundle, latest)
    return versioned


def _rebuild_model(cfg: Dict) -> TransformerRegressor:
    m = TransformerRegressor(
        d_model=cfg.get('d_model', 32),
        nhead=cfg.get('nhead', 4),
        num_layers=cfg.get('num_layers', 2),
        dropout=cfg.get('dropout', 0.1)
    )
    return m


def predict_stock_transformer(ticker: str, days: int = 30) -> Dict:
    path = _bundle_path(ticker)
    if not os.path.exists(path):
        train_stock_transformer(ticker)
    bundle = joblib.load(path)
    cfg = bundle.get('cfg', {})
    model = _rebuild_model(cfg)
    # load weights
    state = {k: torch.from_numpy(np.array(v)) for k, v in bundle['state_dict'].items()}
    model.load_state_dict(state, strict=True)
    model.eval()
    scaler: StandardScaler = bundle['scaler']

    df = _load_data(ticker, period='5y')
    close = df['Close'].astype(float)
    vals = close.values.reshape(-1,1)
    vals_s = scaler.transform(vals).ravel()

    lookback = int(cfg.get('lookback', 60))
    if len(vals_s) < lookback:
        raise RuntimeError('Insufficient data for prediction window')

    window = vals_s[-lookback:].copy()
    preds_s: List[float] = []
    with torch.no_grad():
        for _ in range(days):
            x = torch.from_numpy(window.astype(np.float32)).view(1, lookback, 1)
            yhat = float(model(x).numpy().ravel()[0])
            preds_s.append(yhat)
            window = np.concatenate([window[1:], [yhat]])

    preds_price = scaler.inverse_transform(np.array(preds_s).reshape(-1,1)).ravel().tolist()

    metrics = bundle.get('metrics', {})
    rmse = float(metrics.get('val_rmse_price')) if metrics.get('val_rmse_price') is not None else 0.0
    ci = 1.96 * rmse
    intervals = [[float(p - ci), float(p + ci)] for p in preds_price]

    sma5 = df['Close'].rolling(5).mean().iloc[-1]
    sma20 = df['Close'].rolling(20).mean().iloc[-1]
    rsi14 = _rsi(df['Close'], 14).iloc[-1]

    return {
        'ticker': ticker.upper(),
        'predictions': [float(p) for p in preds_price],
        'intervals': intervals,
        'confidence': float(np.clip(1.0 - (rmse / (np.mean(df['Close']) or 1)), 0, 1)),
        'model_version': f"transformer_v1_{bundle.get('created_at')}",
        'timestamp': pd.Timestamp.utcnow().isoformat(),
        'as_of': df.index[-1].isoformat(),
        'last_close': float(df['Close'].iloc[-1]),
        'sma5': float(sma5) if pd.notna(sma5) else None,
        'sma20': float(sma20) if pd.notna(sma20) else None,
        'rsi14': float(rsi14) if pd.notna(rsi14) else None,
    }


def evaluate_stock_transformer(ticker: str) -> Dict:
    path = _bundle_path(ticker)
    if not os.path.exists(path):
        train_stock_transformer(ticker)
    bundle = joblib.load(path)
    cfg = bundle.get('cfg', {})
    scaler: StandardScaler = bundle['scaler']
    model = _rebuild_model(cfg)
    state = {k: torch.from_numpy(np.array(v)) for k, v in bundle['state_dict'].items()}
    model.load_state_dict(state, strict=True)
    model.eval()

    df = _load_data(ticker, period='5y')
    close = df['Close'].astype(float)
    vals = close.values.reshape(-1, 1)
    vals_s = scaler.transform(vals).ravel()
    lookback = int(cfg.get('lookback', 60))
    if len(vals_s) < lookback + 100:
        raise RuntimeError('Insufficient data for Transformer evaluation')
    # Supervised
    def _make_supervised(values: np.ndarray, lb: int):
        X, y = [], []
        for i in range(len(values) - lb):
            X.append(values[i:i+lb])
            y.append(values[i+lb])
        return np.asarray(X), np.asarray(y)
    X, y = _make_supervised(vals_s, lookback)
    split = int(len(X) * 0.8)
    X_te, y_te = X[split:], y[split:]
    import torch
    with torch.no_grad():
        X_te_t = torch.from_numpy(X_te.astype(np.float32))[..., None]
        y_hat_s = model(X_te_t).numpy().ravel()
    y_te_price = scaler.inverse_transform(y_te.reshape(-1, 1)).ravel()
    y_hat_price = scaler.inverse_transform(y_hat_s.reshape(-1, 1)).ravel()
    from sklearn.metrics import mean_squared_error, mean_absolute_error
    rmse = float(np.sqrt(mean_squared_error(y_te_price, y_hat_price)))
    mae = float(mean_absolute_error(y_te_price, y_hat_price))
    acc = float(np.mean(np.sign(np.diff(y_te_price)) == np.sign(np.diff(y_hat_price)))) if len(y_te_price) > 1 else 0.0
    # baselines
    raw = close.values
    y_naive = raw[lookback-1:-1][split:]
    sma5_full = pd.Series(raw).rolling(5).mean().shift(1).bfill().values
    y_sma5 = sma5_full[lookback:][split:]
    def _m(y_true, yp):
        return { 'rmse': float(np.sqrt(mean_squared_error(y_true, yp))), 'mae': float(mean_absolute_error(y_true, yp)) }
    return {
        'ticker': ticker.upper(),
        'test_metrics': {'rmse': rmse, 'mae': mae, 'accuracy': acc},
        'baseline': { 'naive': _m(y_te_price, y_naive), 'sma5': _m(y_te_price, y_sma5) },
        'trained_on': bundle.get('created_at'),
        'timestamp': pd.Timestamp.utcnow().isoformat(),
    }
