from pydantic import BaseModel, Field
from typing import Optional


class RatingCreate(BaseModel):
    rating: int = Field(
        ...,
        ge=1,
        le=5
    )

    comment: Optional[str] = None