from __future__ import annotations
from fastapi.testclient import TestClient
from src.api.main import app


client = TestClient(app)


def test_health():
    r = client.get('/api/v1/health')
    assert r.status_code == 200
    body = r.json()
    assert body['status'] == 'ok'


def test_model_not_found():
    r = client.get('/api/v1/models/info', params={'ticker': 'ZZZZ'})
    assert r.status_code in (200, 503)  # 503 if model missing


def test_predict_invalid_ticker():
    r = client.post('/api/v1/predict', json={'ticker': 'AAPL!', 'days': 5})
    assert r.status_code == 400
