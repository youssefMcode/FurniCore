from typing import Literal

from pydantic import BaseModel, Field


class StockAdjustment(BaseModel):
    adjustment_type: Literal["add", "remove"]
    quantity: int = Field(gt=0, le=100000)
    reason: str = Field(min_length=3, max_length=300)