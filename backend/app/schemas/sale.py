from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class SaleItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0, le=10000)
    discount: float = Field(default=0, ge=0)
    customization: dict[str, Any] | None = None


class SaleCreate(BaseModel):
    customer_id: UUID | None = None

    discount: float = Field(default=0, ge=0)

    payment_amount: float = Field(default=0, ge=0)

    payment_method: Literal[
        "cash",
        "card",
        "bank_transfer",
    ] = "cash"

    payment_notes: str | None = Field(
        default=None,
        max_length=500,
    )

    items: list[SaleItemCreate] = Field(
        min_length=1,
        max_length=100,
    )

    @field_validator("payment_notes")
    @classmethod
    def clean_notes(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()
        return value or None

class PaymentCreate(BaseModel):
    amount: float = Field(gt=0)
    payment_method: Literal[
        "cash",
        "card",
        "bank_transfer",
    ]
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("notes")
    @classmethod
    def clean_payment_notes(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()
        return value or None

class ReturnItemCreate(BaseModel):
    sale_item_id: UUID
    quantity: int = Field(gt=0)
    restock: bool = True


class ReturnCreate(BaseModel):
    reason: str | None = Field(
        default=None,
        max_length=500,
    )
    items: list[ReturnItemCreate]