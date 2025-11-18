# Stock Market Prediction (standalone)

This folder contains a small, standalone stock prediction utility.

Files:
- `quick_predict.py` — simple rule-based predictor using yfinance.
- `quick_predict_lstm.py` — LSTM-based predictor that loads models from `models/` (optional).

Notes:
- This project is independent and must not contain references to any other repository names.
- Add a virtualenv and install dependencies locally. Do not commit virtualenv files.

Run example:

```bash
python3 quick_predict.py --ticker AAPL
```

Dockerfile:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```
 
