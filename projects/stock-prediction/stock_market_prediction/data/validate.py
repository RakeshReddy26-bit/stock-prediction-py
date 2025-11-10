from __future__ import annotations
from typing import Any, Dict, List, Tuple
from datetime import datetime
import pandas as pd
from pydantic import ValidationError
import argparse
import json
import sys

from .schema import StockRow, DatasetMetadata

ValidationResult = Tuple[bool, List[Dict[str, Any]], DatasetMetadata]


def _build_metadata(df: pd.DataFrame, ticker: str) -> DatasetMetadata:
    start = pd.to_datetime(df.index.min())
    end = pd.to_datetime(df.index.max())
    return DatasetMetadata(
        ticker=ticker,
        rows=len(df),
        start_date=start.to_pydatetime(),
        end_date=end.to_pydatetime(),
    )


def validate_dataframe(df: pd.DataFrame, ticker: str = "UNKNOWN") -> ValidationResult:
    errors: List[Dict[str, Any]] = []

    # Basic column checks
    required = {"Open", "High", "Low", "Close", "Volume"}
    missing = required - set(df.columns)
    if missing:
        errors.append({"row": None, "field": ",".join(sorted(missing)), "msg": "Missing required columns"})
        meta = _build_metadata(df, ticker)
        return False, errors, meta

    # Index to datetime
    if not isinstance(df.index, (pd.DatetimeIndex)):
        try:
            df = df.copy()
            df.index = pd.to_datetime(df.index)
        except Exception as e:
            errors.append({"row": None, "field": "index", "msg": f"Invalid datetime index: {e}"})
            meta = _build_metadata(df, ticker)
            return False, errors, meta

    # Null checks
    null_counts = df[["Open", "High", "Low", "Close", "Volume"]].isnull().sum()
    for col, cnt in null_counts.items():
        if cnt > 0:
            errors.append({"row": None, "field": col, "msg": f"Contains {cnt} null values"})

    # Row-level validation via Pydantic
    for idx, row in df.iterrows():
        try:
            StockRow(
                date=pd.Timestamp(idx).to_pydatetime(),
                open=float(row["Open"]),
                high=float(row["High"]),
                low=float(row["Low"]),
                close=float(row["Close"]),
                volume=int(row["Volume"]),
            )
        except (ValidationError, ValueError, TypeError) as e:
            errors.append({"row": idx.isoformat(), "field": "*", "msg": str(e)})

    ok = len(errors) == 0
    return ok, errors, _build_metadata(df, ticker)


def main():
    parser = argparse.ArgumentParser(description="Validate stock CSV against schema")
    parser.add_argument('csv_path', help='Path to CSV file with Date index and OHLCV columns')
    parser.add_argument('--ticker', default='UNKNOWN')
    args = parser.parse_args()

    try:
        df = pd.read_csv(args.csv_path, index_col='Date', parse_dates=True)
    except Exception as e:
        print(json.dumps({"ok": False, "error": f"Failed to read CSV: {e}"}))
        sys.exit(2)

    ok, errors, meta = validate_dataframe(df, ticker=args.ticker)
    out = {
        "ok": ok,
        "errors": errors,
        "metadata": meta.model_dump(),
    }
    print(json.dumps(out, default=str))
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
