from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import require_admin
from app.models.explanation import Explanation
from app.models.topic_tag import TopicTag
from app.models.user import User
from app.schemas.admin import AdminStatsResponse, AdminTopicCount, AdminUserSummary, AdminUsersResponse

router = APIRouter(tags=["admin"])


@router.get("/admin/stats", response_model=AdminStatsResponse)
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(require_admin),
) -> AdminStatsResponse:
    total_users = int(
        (await db.execute(select(func.count(User.user_id)))).scalar_one()
    )
    total_explanations = int(
        (await db.execute(select(func.count(Explanation.explanation_id)))).scalar_one()
    )

    mode_rows = await db.execute(
        select(Explanation.mode, func.count()).group_by(Explanation.mode)
    )
    explanations_by_mode = {mode: count for mode, count in mode_rows.all()}
    for mode in ["eli12", "caveman", "alien", "story"]:
        explanations_by_mode.setdefault(mode, 0)

    token_rows = await db.execute(
        select(
            func.coalesce(func.sum(Explanation.prompt_tokens), 0),
            func.coalesce(func.sum(Explanation.completion_tokens), 0),
        )
    )
    total_prompt_tokens, total_completion_tokens = token_rows.one()

    top_topic_rows = await db.execute(
        select(TopicTag.tag, func.count(TopicTag.article_id))
        .group_by(TopicTag.tag)
        .order_by(func.count(TopicTag.article_id).desc())
        .limit(10)
    )
    top_topics = [
        AdminTopicCount(tag=tag, article_count=count)
        for tag, count in top_topic_rows.all()
    ]

    rating_rows = await db.execute(
        select(
            func.count().filter(Explanation.rating == "up"),
            func.count().filter(Explanation.rating == "down"),
        )
    )
    thumbs_up, thumbs_down = rating_rows.one()

    return AdminStatsResponse(
        total_users=total_users,
        total_explanations=total_explanations,
        explanations_by_mode=explanations_by_mode,
        total_prompt_tokens=int(total_prompt_tokens),
        total_completion_tokens=int(total_completion_tokens),
        top_topics=top_topics,
        ratings={"thumbs_up": int(thumbs_up), "thumbs_down": int(thumbs_down)},
    )


@router.get("/admin/users", response_model=AdminUsersResponse)
async def admin_users(
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(require_admin),
) -> AdminUsersResponse:
    result = await db.execute(
        select(User, func.count(Explanation.explanation_id))
        .outerjoin(Explanation, Explanation.user_id == User.user_id)
        .group_by(User.user_id)
        .order_by(User.created_at.desc())
    )
    users = [
        AdminUserSummary(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            explanation_count=int(count),
        )
        for user, count in result.all()
    ]
    return AdminUsersResponse(users=users)
