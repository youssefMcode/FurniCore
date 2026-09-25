from pydantic import BaseModel, Field


class BusinessSettingsUpdate(BaseModel):
    business_name: str = Field(min_length=2, max_length=150)
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=300)
    currency: str = Field(min_length=3, max_length=3)