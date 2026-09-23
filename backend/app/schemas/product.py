from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    is_active: Optional[bool] = None


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    sku: str = Field(min_length=1, max_length=80)
    category_id: str

    description: Optional[str] = Field(default=None, max_length=2000)

    cost_price: Decimal = Field(ge=0)
    selling_price: Decimal = Field(ge=0)

    stock_quantity: int = Field(default=0, ge=0)
    minimum_stock: int = Field(default=0, ge=0)

    is_customizable: bool = False
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    sku: Optional[str] = Field(default=None, min_length=1, max_length=80)
    category_id: Optional[str] = None

    description: Optional[str] = Field(default=None, max_length=2000)

    cost_price: Optional[Decimal] = Field(default=None, ge=0)
    selling_price: Optional[Decimal] = Field(default=None, ge=0)

    minimum_stock: Optional[int] = Field(default=None, ge=0)

    is_customizable: Optional[bool] = None
    is_active: Optional[bool] = None