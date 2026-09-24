from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field
from typing import Literal


ExpenseCategory = Literal[
    "rent",
    "electricity",
    "transport",
    "maintenance",
    "salaries",
    "other",
]


class ExpenseCreate(BaseModel):
    category: ExpenseCategory
    amount: Decimal = Field(gt=0)
    description: str = Field(min_length=2, max_length=500)
    expense_date: date


class ExpenseUpdate(BaseModel):
    category: ExpenseCategory | None = None
    amount: Decimal | None = Field(default=None, gt=0)
    description: str | None = Field(
        default=None,
        min_length=2,
        max_length=500,
    )
    expense_date: date | None = None