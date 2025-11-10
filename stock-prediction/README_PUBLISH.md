# Stock Prediction — Quick publish support files

This file contains quick notes and CI workflow added by the split assistant to help you
publish and validate the `stock-prediction` project after you push it to GitHub.

How to run locally
1. Create a Python virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Run tests:

```bash
pytest -q
```

Notes
- The repository includes Jupyter notebooks and a small microservice under `projects/stock-prediction`.
- If you intend to publish the microservice variant, see `projects/stock-prediction/stock_market_prediction/README.md`.
