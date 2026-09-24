from pydantic import BaseModel, EmailStr, Field
from typing import Literal


UserRole = Literal["admin", "cashier"]


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = "cashier"


class UserUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    role: UserRole | None = None
    is_active: bool | None = None