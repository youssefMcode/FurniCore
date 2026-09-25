from pydantic import BaseModel, Field


class ProductDescriptionRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=100)
    is_customizable: bool = False


class ProductDescriptionResponse(BaseModel):
    description: str

class BusinessAssistantRequest(BaseModel):
    question: str = Field(
        min_length=3,
        max_length=500,
    )


class BusinessAssistantResponse(BaseModel):
    answer: str