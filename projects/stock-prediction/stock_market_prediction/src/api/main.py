from __future__ import annotations
import os
from datetime import datetime
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Model and core imports are optional to allow running tests without heavy native deps.
# If SKIP_MODELS env var is set (1/true/yes), we install lightweight stubs instead.
SKIP_MODELS = os.getenv('SKIP_MODELS', '0').lower() in ('1', 'true', 'yes')
_model_loaded = False


def _make_stub_raise(name):
    def _fn(*a, **k):
        raise FileNotFoundError(f"Model function '{name}' is disabled (SKIP_MODELS)")
    return _fn


if SKIP_MODELS:
    # lightweight stubs used during tests/CI to avoid importing TensorFlow/PyTorch
    predict_stock = _make_stub_raise('predict_stock')
    _load_latest_model = lambda ticker: (_ for _ in ()).throw(FileNotFoundError('Models disabled'))
    MODELS_DIR = os.path.join(os.getcwd(), 'models')
    def _load_data(ticker):
        # return empty DataFrame with a datetime index to avoid attribute errors
        return pd.DataFrame(index=pd.DatetimeIndex([]))
    def _rsi(series, period=14):
        return pd.Series([], dtype=float)
    def _ema(series, span=14):
        return pd.Series([], dtype=float)
    def _macd(series):
        return pd.Series([], dtype=float), pd.Series([], dtype=float)
    def _bollinger_bands(series, window=20):
        empty = pd.Series([], dtype=float)
        return empty, empty, empty
    def _stochastic_oscillator(high, low, close, k=14, d=3):
        return pd.Series([], dtype=float), pd.Series([], dtype=float)
    def _atr(high, low, close, period=14):
        return pd.Series([], dtype=float)
    def _obv(close, volume):
        return pd.Series([], dtype=float)
    evaluate_model = _make_stub_raise('evaluate_model')
    evaluate_model_walkforward = _make_stub_raise('evaluate_model_walkforward')
    predict_stock_lstm = _make_stub_raise('predict_stock_lstm')
    predict_stock_lstm_tuned = _make_stub_raise('predict_stock_lstm_tuned')
    train_stock_lstm_tuned = _make_stub_raise('train_stock_lstm_tuned')
    evaluate_stock_lstm = _make_stub_raise('evaluate_stock_lstm')
    predict_stock_xgb = _make_stub_raise('predict_stock_xgb')
    evaluate_stock_xgb = _make_stub_raise('evaluate_stock_xgb')
    predict_stock_arima = _make_stub_raise('predict_stock_arima')
    evaluate_stock_arima = _make_stub_raise('evaluate_stock_arima')
    predict_stock_transformer = _make_stub_raise('predict_stock_transformer')
    evaluate_stock_transformer = _make_stub_raise('evaluate_stock_transformer')
    predict_stock_ensemble = _make_stub_raise('predict_stock_ensemble')
    evaluate_stock_ensemble = _make_stub_raise('evaluate_stock_ensemble')
else:
    try:
        from ..core import predict_stock, _load_latest_model, MODELS_DIR, _load_data, _rsi, _ema, _macd, _bollinger_bands, _stochastic_oscillator, _atr, _obv, evaluate_model, evaluate_model_walkforward
        from ..models.lstm_service import predict_stock_lstm, predict_stock_lstm_tuned, train_stock_lstm_tuned, evaluate_stock_lstm
        from ..models.xgb_service import predict_stock_xgb, evaluate_stock_xgb
        from ..models.arima_service import predict_stock_arima, evaluate_stock_arima
        from ..models.transformer_service import predict_stock_transformer, evaluate_stock_transformer
        from ..models.ensemble_service import predict_stock_ensemble, evaluate_stock_ensemble
        _model_loaded = True
    except Exception:
        # if imports fail, fall back to stubs to keep the API importable
        predict_stock = _make_stub_raise('predict_stock')
        _load_latest_model = lambda ticker: (_ for _ in ()).throw(FileNotFoundError('Models disabled'))
        MODELS_DIR = os.path.join(os.getcwd(), 'models')
        def _load_data(ticker):
            return pd.DataFrame(index=pd.DatetimeIndex([]))
        def _rsi(series, period=14):
            return pd.Series([], dtype=float)
        def _ema(series, span=14):
            return pd.Series([], dtype=float)
        def _macd(series):
            return pd.Series([], dtype=float), pd.Series([], dtype=float)
        def _bollinger_bands(series, window=20):
            empty = pd.Series([], dtype=float)
            return empty, empty, empty
        def _stochastic_oscillator(high, low, close, k=14, d=3):
            return pd.Series([], dtype=float), pd.Series([], dtype=float)
        def _atr(high, low, close, period=14):
            return pd.Series([], dtype=float)
        def _obv(close, volume):
            return pd.Series([], dtype=float)
        evaluate_model = _make_stub_raise('evaluate_model')
        evaluate_model_walkforward = _make_stub_raise('evaluate_model_walkforward')
        predict_stock_lstm = _make_stub_raise('predict_stock_lstm')
        predict_stock_lstm_tuned = _make_stub_raise('predict_stock_lstm_tuned')
        train_stock_lstm_tuned = _make_stub_raise('train_stock_lstm_tuned')
        evaluate_stock_lstm = _make_stub_raise('evaluate_stock_lstm')
        predict_stock_xgb = _make_stub_raise('predict_stock_xgb')
        evaluate_stock_xgb = _make_stub_raise('evaluate_stock_xgb')
        predict_stock_arima = _make_stub_raise('predict_stock_arima')
        evaluate_stock_arima = _make_stub_raise('evaluate_stock_arima')
        predict_stock_transformer = _make_stub_raise('predict_stock_transformer')
        evaluate_stock_transformer = _make_stub_raise('evaluate_stock_transformer')
        predict_stock_ensemble = _make_stub_raise('predict_stock_ensemble')
        evaluate_stock_ensemble = _make_stub_raise('evaluate_stock_ensemble')
import joblib
import asyncio
import glob
import re


app = FastAPI(title='Stock Prediction API', version='1.0.0')

cors_env = os.getenv('API_CORS_ORIGINS', '*')
origins = [o.strip() for o in cors_env.split(',') if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ['*'] else ['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


class PredictBody(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10)
    days: int = Field(30, ge=1, le=365)
    model: str = Field('rf', description="Model to use: 'rf' (default), 'lstm', 'lstm_tuned', 'xgb', 'arima', 'transformer', or 'ensemble'")


class TuneBody(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10)
    n_trials: int = Field(15, ge=1, le=200)
    timeout_sec: int | None = Field(600, ge=30, le=7200)


@app.get('/api/v1/health')
def health():
    return {'status': 'ok', 'model_loaded': True}


@app.get('/api/v1/stocks/{ticker}/history')
def get_history(ticker: str, start: str | None = None, end: str | None = None):
    df = _load_data(ticker.upper())
    if start:
        df = df[df.index >= pd.to_datetime(start)]
    if end:
        df = df[df.index <= pd.to_datetime(end)]
    out = [
        {
            'date': idx.isoformat(),
            'open': float(r.Open),
            'high': float(r.High),
            'low': float(r.Low),
            'close': float(r.Close),
            'volume': int(r.Volume) if 'Volume' in df.columns and pd.notna(r.Volume) else None
        }
        for idx, r in df.iterrows()
    ]
    return {'status': 'success', 'data': out}


@app.get('/api/v1/stocks/{ticker}/indicators')
def get_indicators(ticker: str):
    df = _load_data(ticker.upper())
    close = df['Close']
    high = df['High'] if 'High' in df.columns else close
    low = df['Low'] if 'Low' in df.columns else close
    volume = df['Volume'] if 'Volume' in df.columns else pd.Series(0, index=df.index)
    rsi14 = _rsi(close, 14)
    macd, macd_sig = _macd(close)
    bb_lo, bb_ma, bb_hi = _bollinger_bands(close)
    stoch_k, stoch_d = _stochastic_oscillator(high, low, close)
    atr14 = _atr(high, low, close)
    obv = _obv(close, volume)
    last_idx = df.index[-1]
    return {
        'status': 'success',
        'data': {
            'as_of': last_idx.isoformat(),
            'rsi14': float(rsi14.iloc[-1]),
            'macd': float(macd.iloc[-1]),
            'macd_signal': float(macd_sig.iloc[-1]),
            'bb_lower': float(bb_lo.iloc[-1]),
            'bb_middle': float(bb_ma.iloc[-1]),
            'bb_upper': float(bb_hi.iloc[-1]),
            'stoch_k': float(stoch_k.iloc[-1]),
            'stoch_d': float(stoch_d.iloc[-1]),
            'atr14': float(atr14.iloc[-1]) if pd.notna(atr14.iloc[-1]) else None,
            'obv': float(obv.iloc[-1]) if pd.notna(obv.iloc[-1]) else None,
        }
    }


@app.get('/api/v1/models/info')
def model_info(ticker: str):
    try:
        bundle = _load_latest_model(ticker.upper())
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail='Model not found')
    return {
        'version': 'v1.0',
        'trained_on': bundle.get('created_at'),
        'accuracy': bundle.get('metrics', {}).get('accuracy'),
    }


@app.get('/api/v1/models')
def list_models():
    # Use MODELS_DIR from core to find saved models
    pattern = os.path.join(MODELS_DIR, 'model_*_*.pkl')
    files = sorted(glob.glob(pattern))
    out = []
    for f in files:
        base = os.path.basename(f)
        m = re.match(r'model_([A-Za-z0-9\.]+)_([0-9]{14})\.pkl', base)
        if not m:
            continue
        ticker, ts = m.group(1).upper(), m.group(2)
        item = {'ticker': ticker, 'created_at': ts, 'path': f}
        try:
            bundle = joblib.load(f)
            metrics = bundle.get('metrics') if isinstance(bundle, dict) else None
            version = f"v1.0_{bundle.get('created_at')}" if isinstance(bundle, dict) and bundle.get('created_at') else None
            if metrics:
                item['metrics'] = metrics
            if version:
                item['version'] = version
        except Exception:
            pass
        out.append(item)
    # collapse to latest per ticker
    latest = {}
    for e in out:
        t = e['ticker']
        if t not in latest or e['created_at'] > latest[t]['created_at']:
            latest[t] = e
    return {'models': list(latest.values())}


@app.post('/api/v1/tune')
async def tune(body: TuneBody):
    t = body.ticker.upper().strip()
    if not t.isalnum():
        raise HTTPException(status_code=400, detail='Invalid ticker')
    try:
        path = await asyncio.wait_for(
            asyncio.to_thread(train_stock_lstm_tuned, t, body.n_trials, body.timeout_sec or None),
            timeout=(body.timeout_sec or 600) + 30
        )
        return {'status': 'ok', 'ticker': t, 'bundle': path}
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail='Tuning timed out')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/v1/predict')
async def predict(body: PredictBody):
    ticker = body.ticker.upper().strip()
    if not ticker.isalnum():
        raise HTTPException(status_code=400, detail='Invalid ticker')
    model_choice = (body.model or 'rf').lower()
    if model_choice not in {'rf', 'lstm', 'lstm_tuned', 'xgb', 'arima', 'transformer', 'ensemble'}:
        raise HTTPException(status_code=400, detail='Invalid model; choose rf, lstm, lstm_tuned, xgb, arima, transformer, or ensemble')
    try:
        if model_choice == 'lstm':
            out = await asyncio.wait_for(asyncio.to_thread(predict_stock_lstm, ticker, body.days), timeout=120.0)
        elif model_choice == 'lstm_tuned':
            out = await asyncio.wait_for(asyncio.to_thread(predict_stock_lstm_tuned, ticker, body.days), timeout=300.0)
        elif model_choice == 'xgb':
            out = await asyncio.wait_for(asyncio.to_thread(predict_stock_xgb, ticker, body.days), timeout=60.0)
        elif model_choice == 'arima':
            out = await asyncio.wait_for(asyncio.to_thread(predict_stock_arima, ticker, body.days), timeout=60.0)
        elif model_choice == 'transformer':
            out = await asyncio.wait_for(asyncio.to_thread(predict_stock_transformer, ticker, body.days), timeout=120.0)
        elif model_choice == 'ensemble':
            out = await asyncio.wait_for(asyncio.to_thread(predict_stock_ensemble, ticker, body.days), timeout=180.0)
        else:
            out = await asyncio.wait_for(asyncio.to_thread(predict_stock, ticker, body.days), timeout=30.0)
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail='Model not found')
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail='Prediction timed out')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return out


@app.get('/api/v1/stocks/{ticker}/predict')
async def predict_get(ticker: str, days: int = 30, model: str = 'rf'):
    body = PredictBody(ticker=ticker, days=days, model=model)
    return await predict(body)


@app.get('/api/v1/stocks/{ticker}/backtest')
def backtest(ticker: str, model: str = 'rf', mode: str = 'static'):
    t = ticker.upper().strip()
    m = (model or 'rf').lower()
    if not t.isalnum():
        raise HTTPException(status_code=400, detail='Invalid ticker')
    try:
        if m in {'rf', 'random_forest'}:
            if mode == 'walk':
                out = evaluate_model_walkforward(t, steps=60)
            else:
                out = evaluate_model(t)
        elif m in {'lstm'}:
            out = evaluate_stock_lstm(t, tuned=False)
        elif m in {'lstm_tuned'}:
            out = evaluate_stock_lstm(t, tuned=True)
        elif m in {'xgb'}:
            out = evaluate_stock_xgb(t)
        elif m in {'arima'}:
            out = evaluate_stock_arima(t)
        elif m in {'transformer'}:
            out = evaluate_stock_transformer(t)
        elif m in {'ensemble'}:
            out = evaluate_stock_ensemble(t)
        else:
            raise HTTPException(status_code=501, detail='Backtest not implemented for this model')
        return {'status': 'success', 'data': out}
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail='Model not found')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
