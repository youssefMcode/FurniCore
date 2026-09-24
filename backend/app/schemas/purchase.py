from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class PurchaseItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)
    unit_cost: Decimal = Field(ge=0)


class PurchaseCreate(BaseModel):
    supplier_id: UUID
    purchase_date: date
    notes: str | None = Field(default=None, max_length=1000)
    items: list[PurchaseItemCreate] = Field(min_length=1)