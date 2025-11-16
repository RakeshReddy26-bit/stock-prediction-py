"""
Sample/Real Stock Data Generator
Adds generate_training_data(ticker, start_date, end_date) using yfinance,
validates, and saves to data/raw/{ticker}_{date}.csv
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from data.validate import validate_dataframe
import os
try:
    import yfinance as yf
except Exception:
    yf = None

def generate_sample_data(ticker='SAMPLE', days=365, start_price=100):
    """
    Generate realistic sample stock data with consistent OHLC relationships
    
    Args:
        ticker: Stock ticker symbol
        days: Number of days of data to generate
        start_price: Starting price
    
    Returns:
        DataFrame with stock data
    """
    np.random.seed(42)
    dates = [datetime.now() - timedelta(days=x) for x in range(days, 0, -1)]

    prices = [start_price]
    for _ in range(days - 1):
        change = np.random.normal(0, 2)
        new_price = max(prices[-1] + change, 50)
        prices.append(new_price)

    opens = []
    highs = []
    lows = []
    closes = []
    volumes = []

    for p in prices:
        o = p + np.random.uniform(-1.0, 1.0)
        c = p + np.random.uniform(-1.0, 1.0)
        base_max = max(o, c)
        base_min = min(o, c)
        h = base_max + np.random.uniform(0.0, 3.0)
        l = base_min - np.random.uniform(0.0, 3.0)
        opens.append(o)
        closes.append(c)
        highs.append(h)
        lows.append(l)
        volumes.append(np.random.randint(1_000_000, 5_000_000))

    data = {
        'Date': dates,
        'Open': opens,
        'High': highs,
        'Low': lows,
        'Close': closes,
        'Volume': volumes,
    }

    df = pd.DataFrame(data)
    df.set_index('Date', inplace=True)
    return df

if __name__ == '__main__':
    # Generate sample data
    print("Generating sample stock data...")
    df = generate_sample_data(days=365)

    # Validate
    ok, errors, meta = validate_dataframe(df, ticker='SAMPLE')
    if not ok:
        print("Validation errors:")
        for e in errors[:10]:
            print(" -", e)
    else:
        print("✓ Data validation passed:", meta.model_dump())

    # Save to CSV
    df.to_csv('stock_data.csv')
    print("✓ Sample data saved to 'stock_data.csv'")

    print("\nFirst few rows:")
    print(df.head())

    print("\nData statistics:")
    print(df.describe())


def generate_training_data(ticker: str, start_date: str, end_date: str) -> str:
    """
    Fetch real data via yfinance, validate and save to data/raw.
    Returns path to saved CSV.
    """
    if yf is None:
        raise RuntimeError('yfinance not available')
    df = yf.download(ticker, start=start_date, end=end_date, progress=False, auto_adjust=True)
    if df.empty:
        raise RuntimeError('No data returned from yfinance')
    ok, errors, meta = validate_dataframe(df, ticker=ticker)
    if not ok:
        raise RuntimeError(f"Data validation failed: {errors[:3]}")
    raw_dir = os.path.join(os.path.dirname(__file__), 'data', 'raw')
    os.makedirs(raw_dir, exist_ok=True)
    out_path = os.path.join(raw_dir, f"{ticker}_{datetime.now().strftime('%Y%m%d')}.csv")
    df.to_csv(out_path)
    return out_path
