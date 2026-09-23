from pydantic import BaseModel, Field, field_validator


class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=5, max_length=30)
    address: str | None = Field(default=None, max_length=300)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("name", "phone")
    @classmethod
    def clean_required_fields(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Field cannot be empty.")

        return value

    @field_validator("address", "notes")
    @classmethod
    def clean_optional_fields(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()
        return value or None


class CustomerUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )
    phone: str | None = Field(
        default=None,
        min_length=5,
        max_length=30,
    )
    address: str | None = Field(
        default=None,
        max_length=300,
    )
    notes: str | None = Field(
        default=None,
        max_length=1000,
    )

    @field_validator("name", "phone")
    @classmethod
    def clean_required_fields(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise ValueError("Field cannot be empty.")

        return value

    @field_validator("address", "notes")
    @classmethod
    def clean_optional_fields(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()
        return value or None