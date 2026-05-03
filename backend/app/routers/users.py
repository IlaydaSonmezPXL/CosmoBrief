from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import get_current_user, http_error
from app.models.article_cache import ArticleCache
from app.models.topic_tag import TopicTag
from app.schemas.article import ReadingMapArticle, ReadingMapResponse, ReadingMapTopic

router = APIRouter(tags=["users"])


@router.get("/users/{user_id}/reading-map", response_model=ReadingMapResponse)
async def reading_map(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
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
