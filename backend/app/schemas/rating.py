
from pydantic import BaseModel

from app.schemas.explanation import ExplanationMode, RatingValue


class RatingRequest(BaseModel):
    rating: RatingValue


class RatingResponse(BaseModel):
    article_id: int
    mode: ExplanationMode
    version: int
    rating: RatingValue
    needs_regeneration: bool
