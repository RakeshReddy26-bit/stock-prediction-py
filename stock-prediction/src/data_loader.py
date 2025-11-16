"""
data_loader.py
Fetches and cleans market data for modeling.

Example usage:
    from src.data_loader import load_stock_data
    df = load_stock_data('AAPL', '2015-01-01', '2023-12-31')
"""

import os
import logging
from typing import Optional
import pandas as pd
import yfinance as yf

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
os.makedirs(RAW_DATA_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

def load_stock_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    """
    Download daily OHLCV data for a given ticker using yfinance, with data quality checks and caching.
    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL').
        start_date: Start date (YYYY-MM-DD).
        end_date: End date (YYYY-MM-DD).
    Returns:
        DataFrame with DatetimeIndex and columns: ['Open', 'High', 'Low', 'Close', 'Volume']
    Raises:
        ValueError: If data quality checks fail.
    Example:
        df = load_stock_data('AAPL', '2015-01-01', '2023-12-31')
    """
    cache_path = os.path.join(RAW_DATA_DIR, f"{ticker}.parquet")
    try:
        if os.path.exists(cache_path):
            logger.info(f"Loading cached data for {ticker} from {cache_path}")
            df = pd.read_parquet(cache_path)
        else:
            logger.info(f"Downloading data for {ticker} from yfinance")
            df = yf.download(ticker, start=start_date, end=end_date, progress=False)
            df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
            df.index = pd.to_datetime(df.index)
            df.index.name = 'Date'
            # Forward fill missing data (limit 5 days)
            df = df.ffill(limit=5)
            # Data quality checks
            if len(df) < 252:
                logger.error(f"Insufficient data: {len(df)} rows (min 252 required)")
                raise ValueError(f"Insufficient data: {len(df)} rows (min 252 required)")
            if (df['Volume'] == 0).all():
                logger.error("All volume values are zero")
                raise ValueError("All volume values are zero")
            # Cache to parquet
            df.to_parquet(cache_path)
            logger.info(f"Cached data to {cache_path}")
        return df
    except Exception as e:
        logger.error(f"Failed to load data for {ticker}: {e}")
        raise
