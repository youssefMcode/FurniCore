from pydantic import BaseModel, Field


class SupplierCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=300)
    notes: str | None = Field(default=None, max_length=1000)


class SupplierUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=300)
    notes: str | None = Field(default=None, max_length=1000)
    is_active: bool | None = None