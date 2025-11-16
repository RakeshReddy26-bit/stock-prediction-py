"""
sentiment.py
Fetches and scores news sentiment for a given ticker and date range using FinBERT.
"""

import os
import pandas as pd
import requests
from transformers import pipeline
from datetime import datetime, timedelta
import time
import hashlib

CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed', 'sentiment_cache')
os.makedirs(CACHE_DIR, exist_ok=True)

finbert = pipeline("sentiment-analysis", model="yiyanghkust/finbert-tone")

NEWS_API_KEY = os.getenv("NEWS_API_KEY")  # Set your NewsAPI or FMP key here


def get_news_sentiment(ticker: str, date_range: tuple) -> pd.DataFrame:
    """
    Fetch news headlines, score sentiment with FinBERT, aggregate daily, and merge with price data.
    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')
        date_range: (start_date, end_date) as strings 'YYYY-MM-DD'
    Returns:
        DataFrame with ['date', 'sentiment_score', 'sentiment_std', 'news_count']
    """
    start_date, end_date = date_range
    cache_key = hashlib.md5(f"{ticker}_{start_date}_{end_date}".encode()).hexdigest()
    cache_path = os.path.join(CACHE_DIR, f"{cache_key}.parquet")
    if os.path.exists(cache_path):
        return pd.read_parquet(cache_path)
    headlines = []
    # Example: NewsAPI (replace with FMP if needed)
    url = f"https://newsapi.org/v2/everything?q={ticker}&from={start_date}&to={end_date}&sortBy=publishedAt&apiKey={NEWS_API_KEY}"
    page = 1
    while True:
        resp = requests.get(url + f"&page={page}")
        if resp.status_code == 429:
            print("Rate limit hit, sleeping...")
            time.sleep(60)
            continue
        data = resp.json()
        if 'articles' not in data or not data['articles']:
            break
        for article in data['articles']:
            headlines.append({
                'date': article['publishedAt'][:10],
                'headline': article['title']
            })
        if len(data['articles']) < 100:
            break
        page += 1
    if not headlines:
        return pd.DataFrame(columns=['date', 'sentiment_score', 'sentiment_std', 'news_count'])
    df_news = pd.DataFrame(headlines)
    df_news['sentiment'] = df_news['headline'].apply(lambda x: finbert(x)[0]['score'] if x else 0)
    daily = df_news.groupby('date').agg(
        sentiment_score=('sentiment', 'mean'),
        sentiment_std=('sentiment', 'std'),
        news_count=('headline', 'count')
    ).reset_index()
    daily['date'] = pd.to_datetime(daily['date'])
    daily.to_parquet(cache_path)
    return daily
