from datetime import datetime
from typing import Dict, List
from uuid import UUID

from pydantic import BaseModel


class AdminTopicCount(BaseModel):
    tag: str
    article_count: int


class AdminStatsResponse(BaseModel):
    total_users: int
    total_explanations: int
    explanations_by_mode: Dict[str, int]
    total_prompt_tokens: int
    total_completion_tokens: int
    top_topics: List[AdminTopicCount]
    ratings: Dict[str, int]


class AdminUserSummary(BaseModel):
    user_id: UUID
    username: str
    email: str
    role: str
    created_at: datetime
    explanation_count: int


class AdminUsersResponse(BaseModel):
    users: List[AdminUserSummary]
