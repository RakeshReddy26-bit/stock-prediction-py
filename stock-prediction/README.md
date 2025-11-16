# Stock Prediction System

A robust financial machine learning framework for realistic stock market prediction and scenario modeling.

## Principles
- Time-series splits only (no random shuffle)
- All backtests include transaction costs and slippage
- Risk metrics (Sharpe, drawdown, turnover) reported alongside accuracy
- No data snooping: features are real-time computable
- All assumptions and limitations documented

## Tech Stack
- Python 3.10+
- pandas, numpy, yfinance, scikit-learn, xgboost, torch, matplotlib, seaborn, pytest

---

![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

# Project Structure

```
stock-prediction/
├── data/
│   ├── raw/              # Downloaded market data
│   └── processed/        # Engineered features
├── src/
│   ├── data_loader.py    # Data fetching and cleaning
│   ├── features.py       # Feature engineering
│   ├── models.py         # Model definitions
│   ├── backtester.py     # Strategy backtesting
│   └── utils.py          # Helper functions
├── notebooks/
│   ├── 01_eda.ipynb      # Exploratory analysis
│   ├── 02_baseline.ipynb # Baseline models
│   └── 03_lstm.ipynb     # Deep learning experiments
├── tests/
├── requirements.txt
├── README.md
├── RISK_DISCLOSURE.md
└── outputs/
    └── backtest_results.png
```

# Key Features
- Walk-forward validation (expanding window CV)
- Transaction cost and slippage modeling
- LSTM and baseline model comparison
- Comprehensive risk metrics: Sharpe, drawdown, turnover, Sortino
- Realistic backtesting and scenario analysis

# Results
- Model comparison table (see notebooks/02_baseline.ipynb)
- Best Sharpe ratio: reported in backtest summary
- Drawdown analysis: see outputs/backtest_results.png

# Next Steps
- Add sentiment features (news, Twitter)
- Multi-asset portfolio backtests
- Explore reinforcement learning agents for trading

# References
- [Advances in Financial Machine Learning (Marcos López de Prado)](https://www.wiley.com/en-us/Advances+in+Financial+Machine+Learning-p-9781119482086)
- [Machine Learning for Asset Managers (Marcos López de Prado)](https://www.cambridge.org/core/books/machine-learning-for-asset-managers/)
- [yfinance documentation](https://github.com/ranaroussi/yfinance)
- [XGBoost documentation](https://xgboost.readthedocs.io/en/stable/)

# License & Disclaimer
- MIT License
- See [RISK_DISCLOSURE.md](./RISK_DISCLOSURE.md) for important usage guidelines and limitations.

## Usage
1. Install dependencies: `pip install -r requirements.txt`
2. Run notebooks for EDA, baseline, and LSTM experiments
3. Use `src/` modules for data, features, modeling, and backtesting
4. Add unit tests in `tests/`

## Assumptions & Limitations
- All features are lagged and computable in real time
- No lookahead bias or data snooping
- Backtests include realistic costs and slippage
- Models are probabilistic, not predictive oracles
- Results are for research only, not investment advice

# Project Overview

This project provides an educational framework for stock prediction using machine learning. The goal is to demonstrate realistic financial ML workflows, including proper time-series backtesting, risk metrics, and scenario analysis. All code is designed for transparency, reproducibility, and learning—not for financial advice or live trading.

Key features:
- Feature engineering for financial time series
- Baseline and deep learning models
- Walk-forward cross-validation
- Realistic backtesting with transaction costs and slippage
- Comprehensive risk metrics (Sharpe, drawdown, turnover)
- Clear documentation and risk disclosure

# Installation

1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd stock-prediction
   ```
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. (Optional) Set up Jupyter or VS Code for notebooks:
   ```sh
   pip install notebook
   # or use VS Code's Jupyter extension
   ```

# Quick Start

1. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
2. Run a notebook example:
   - Open `notebooks/01_eda.ipynb` or `notebooks/02_baseline.ipynb` in Jupyter or VS Code.
   - Follow the step-by-step cells to load data, engineer features, train models, and backtest strategies.
3. Run unit tests:
   ```sh
   PYTHONPATH=src pytest tests/
   ```
4. Review results and risk disclosures:
   - See `outputs/backtest_results.png` for strategy performance plots.
   - Read `RISK_DISCLOSURE.md` for important usage guidelines.

For more details, see the documentation and example notebooks.
