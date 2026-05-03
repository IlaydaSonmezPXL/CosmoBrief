from typing import Literal, Optional, cast

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import get_current_user, http_error
from app.models.article_cache import ArticleCache
from app.models.explanation import Explanation
from app.schemas.explanation import (
    ExplanationHistoryItem,
    ExplanationHistoryResponse,
    ExplanationMode,
    ExplanationRequest,
    ExplanationResponse,
)
from app.services.explanation_service import get_or_generate_explanation

router = APIRouter(tags=["explanations"])


@router.post("/articles/{article_id}/explanations", response_model=ExplanationResponse)
async def create_explanation(
    article_id: int,
    payload: ExplanationRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ExplanationResponse:
    article = await db.get(ArticleCache, article_id)
    if not article:
        http_error(404, "article_not_found", "Article not found in cache.")

    explanation, source = await get_or_generate_explanation(
        db,
        current_user.user_id,
        article_id,
        payload.mode,
        article.title,
        article.summary,
    )
    if source == "generated":
        response.status_code = status.HTTP_201_CREATED

    return ExplanationResponse(
        article_id=article_id,
        mode=payload.mode,
        version=explanation.version,
        text=explanation.text,
        generated_at=explanation.generated_at,
        rating=cast(Optional[Literal["up", "down"]], explanation.rating),
        source=cast(Literal["cached", "generated"], source),
    )


@router.get(
    "/articles/{article_id}/explanations/{mode}/history",
    response_model=ExplanationHistoryResponse,
)
async def explanation_history(
    article_id: int,
    mode: ExplanationMode,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ExplanationHistoryResponse:
    result = await db.execute(
        select(Explanation)
        .where(
            Explanation.user_id == current_user.user_id,
            Explanation.article_id == article_id,
            Explanation.mode == mode,
        )
        .order_by(Explanation.version.asc())
    )
    versions = [
        ExplanationHistoryItem(
            version=exp.version,
            text=exp.text,
            generated_at=exp.generated_at,
            rating=cast(Optional[Literal["up", "down"]], exp.rating),
            needs_regeneration=exp.needs_regeneration,
        )
        for exp in result.scalars().all()
    ]

    return ExplanationHistoryResponse(
        article_id=article_id,
        mode=mode,
        versions=versions,
    )
