from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel

ExplanationMode = Literal["eli12", "caveman", "alien", "story"]
RatingValue = Literal["up", "down"]
ExplanationSource = Literal["cached", "generated"]


class ExplanationRequest(BaseModel):
    mode: ExplanationMode


class ExplanationResponse(BaseModel):
    article_id: int
    mode: ExplanationMode
    version: int
    text: str
    generated_at: datetime
    rating: Optional[RatingValue]
    source: ExplanationSource


class ExplanationHistoryItem(BaseModel):
    version: int
    text: str
    generated_at: datetime
    rating: Optional[RatingValue]
    needs_regeneration: bool


class ExplanationHistoryResponse(BaseModel):
    article_id: int
    mode: ExplanationMode
    versions: List[ExplanationHistoryItem]
