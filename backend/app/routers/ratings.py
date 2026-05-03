from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import get_current_user, http_error
from app.models.explanation import Explanation
from app.schemas.explanation import ExplanationMode
from app.schemas.rating import RatingRequest, RatingResponse

router = APIRouter(tags=["ratings"])


@router.post(
    "/articles/{article_id}/explanations/{mode}/{version}/rating",
    response_model=RatingResponse,
)
async def rate_explanation(
    article_id: int,
    mode: ExplanationMode,
    version: int,
    payload: RatingRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> RatingResponse:
    result = await db.execute(
        select(Explanation)
        .where(
            Explanation.user_id == current_user.user_id,
            Explanation.article_id == article_id,
            Explanation.mode == mode,
        )
        .order_by(Explanation.version.desc())
        .limit(1)
    )
    latest = result.scalar_one_or_none()
    if not latest:
        http_error(404, "explanation_not_found", "Explanation not found.")

    if latest.version != version:
        http_error(403, "version_not_latest", "Only the latest version may be rated.")

    if latest.rating is not None:
        http_error(409, "already_rated", "This version has already been rated.")

    latest.rating = payload.rating
    if payload.rating == "down":
        latest.needs_regeneration = True
    await db.commit()

    return RatingResponse(
        article_id=article_id,
        mode=mode,
        version=latest.version,
        rating=latest.rating,
        needs_regeneration=latest.needs_regeneration,
    )
