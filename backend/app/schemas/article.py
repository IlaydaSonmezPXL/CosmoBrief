from datetime import datetime
from typing import Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel

ArticleState = Literal["new", "read", "explained", "saved", "dismissed"]
Freshness = Literal["fresh", "aging", "archived"]
ExplanationMode = Literal["eli12", "caveman", "scientist", "story"]
RatingValue = Literal["up", "down"]


class ArticleSummary(BaseModel):
    article_id: int
    title: str
    summary: Optional[str]
    news_site: Optional[str]
    published_at: Optional[datetime]
    url: Optional[str]
    image_url: Optional[str]
    freshness: Freshness
    state: ArticleState


class ArticleListResponse(BaseModel):
    articles: List[ArticleSummary]
    total: int
    limit: int
    offset: int


class ExplanationStatus(BaseModel):
    available: bool
    latest_version: Optional[int]
    needs_regeneration: bool
    rating: Optional[RatingValue]


class ArticleDetailResponse(ArticleSummary):
    explanations: Dict[ExplanationMode, ExplanationStatus]


class ArticleStateTransitionRequest(BaseModel):
    target_state: Literal["saved", "dismissed"]


class ArticleStateTransitionResponse(BaseModel):
    article_id: int
    previous_state: ArticleState
    new_state: ArticleState
    transitioned_at: datetime


class ReadingMapArticle(BaseModel):
    article_id: int
    title: str
    news_site: Optional[str]
    published_at: Optional[datetime]


class ReadingMapTopic(BaseModel):
    tag: str
    article_count: int
    articles: List[ReadingMapArticle]


class ReadingMapResponse(BaseModel):
    user_id: UUID
    topics: List[ReadingMapTopic]
