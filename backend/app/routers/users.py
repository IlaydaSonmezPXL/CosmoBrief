from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import get_current_user, http_error
from app.models.article_cache import ArticleCache
from app.models.article_state import ArticleState
from app.models.explanation import Explanation
from app.models.topic_tag import TopicTag
from app.models.user import User
from app.schemas.article import ReadingMapArticle, ReadingMapResponse, ReadingMapTopic
from app.schemas.users import UpdateMeRequest, UserMeResponse
from app.services.auth_service import hash_password, verify_password

router = APIRouter(tags=["users"])


@router.get("/users/me", response_model=UserMeResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserMeResponse:
    return UserMeResponse(
        user_id=current_user.user_id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at,
    )


@router.patch("/users/me", response_model=UserMeResponse)
async def update_me(
    payload: UpdateMeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserMeResponse:
    if not verify_password(payload.current_password, current_user.password_hash):
        http_error(401, "invalid_password", "Current password is incorrect.")

    if payload.new_username is not None and payload.new_username != current_user.username:
        existing = await db.execute(select(User).where(User.username == payload.new_username))
        if existing.scalar_one_or_none():
            http_error(409, "username_taken", "Username already taken.")
        current_user.username = payload.new_username

    if payload.new_email is not None and payload.new_email != current_user.email:
        existing = await db.execute(select(User).where(User.email == payload.new_email))
        if existing.scalar_one_or_none():
            http_error(409, "email_taken", "Email already taken.")
        current_user.email = payload.new_email

    if payload.new_password is not None:
        current_user.password_hash = hash_password(payload.new_password)

    await db.commit()
    await db.refresh(current_user)

    return UserMeResponse(
        user_id=current_user.user_id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at,
    )


@router.delete("/users/me/data", status_code=status.HTTP_204_NO_CONTENT)
async def wipe_my_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await db.execute(delete(ArticleState).where(ArticleState.user_id == current_user.user_id))
    await db.execute(delete(TopicTag).where(TopicTag.user_id == current_user.user_id))
    await db.execute(delete(Explanation).where(Explanation.user_id == current_user.user_id))
    await db.commit()


@router.get("/users/{user_id}/reading-map", response_model=ReadingMapResponse)
async def reading_map(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReadingMapResponse:
    if current_user.user_id != user_id and current_user.role != "admin":
        http_error(403, "forbidden", "Not authorized to access this reading map.")

    result = await db.execute(
        select(TopicTag.tag, ArticleCache)
        .join(ArticleCache, ArticleCache.article_id == TopicTag.article_id)
        .where(TopicTag.user_id == user_id)
        .order_by(TopicTag.tag, ArticleCache.published_at.desc().nullslast())
    )

    tag_articles: dict[str, list[ArticleCache]] = defaultdict(list)
    for tag, article in result.all():
        tag_articles[tag].append(article)

    topics = [
        ReadingMapTopic(
            tag=tag,
            article_count=len(articles),
            articles=[
                ReadingMapArticle(
                    article_id=a.article_id,
                    title=a.title,
                    news_site=a.news_site,
                    published_at=a.published_at,
                )
                for a in articles
            ],
        )
        for tag, articles in sorted(tag_articles.items(), key=lambda x: len(x[1]), reverse=True)
    ]

    return ReadingMapResponse(user_id=user_id, topics=topics)
