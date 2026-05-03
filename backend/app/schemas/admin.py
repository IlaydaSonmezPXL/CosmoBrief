from typing import Dict, List

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
