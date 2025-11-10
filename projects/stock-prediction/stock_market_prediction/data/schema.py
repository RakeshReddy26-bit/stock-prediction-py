from __future__ import annotations
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from pydantic import ConfigDict

class PredictRequest(BaseModel):
    """Request payload for predictions."""
    ticker: str = Field(..., min_length=1, max_length=10, description="Ticker symbol")
    start_date: Optional[date] = Field(None, description="Inclusive start date")
    end_date: Optional[date] = Field(None, description="Inclusive end date")

    @validator('ticker')
    def upper(cls, v: str) -> str:
        return v.upper().strip()

class PredictPoint(BaseModel):
    date: date
    close: float
    predicted: Optional[float] = None

class PredictResponse(BaseModel):
    """Response payload for predictions."""
    model_config = ConfigDict(protected_namespaces=())
    predictions: List[PredictPoint]
    confidence: float = 0.5
    model_version: str
    timestamp: str

class StockRow(BaseModel):
    date: datetime = Field(..., description="Timestamp of the row")
    open: float = Field(..., gt=0)
    high: float = Field(..., gt=0)
    low: float = Field(..., gt=0)
    close: float = Field(..., gt=0)
    volume: int = Field(..., ge=0)

    @validator('high')
    def high_ge_open_close(cls, v, values):
        o = values.get('open'); c = values.get('close')
        if o is not None and v < o:
            raise ValueError('high must be >= open')
        if c is not None and v < c:
            raise ValueError('high must be >= close')
        return v

    @validator('low')
    def low_le_open_close(cls, v, values):
        o = values.get('open'); c = values.get('close')
        if o is not None and v > o:
            raise ValueError('low must be <= open')
        if c is not None and v > c:
            raise ValueError('low must be <= close')
        return v

class DatasetMetadata(BaseModel):
    ticker: str
    rows: int
    start_date: datetime
    end_date: datetime
