from datetime import datetime, timedelta, timezone
from typing import Literal, Optional, cast

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.config import settings
from app.db import get_db
from app.dependencies import get_current_user, http_error
from app.models.article_cache import ArticleCache
from app.models.article_state import ArticleState
from app.models.explanation import Explanation
from app.models.topic_tag import TopicTag
from app.schemas.article import (
    ArticleDetailResponse,
    ArticleListResponse,
    ArticleTopicsResponse,
    ArticleSummary,
    ExplanationStatus,
    TopicCount,
)
from app.services.snapi_client import SnapiUnavailable, classify_freshness, ensure_cache_fresh
from app.services.state_machine import validate_transition

router = APIRouter(tags=["articles"])

StateFilter = Optional[Literal["new", "read", "explained"]]
FreshnessFilter = Optional[Literal["fresh", "aging", "archived"]]


def apply_filters(stmt, state_filter, freshness_filter, state_alias, now, q=None, topic_filter=None):
    if topic_filter:
        stmt = stmt.where(
            ArticleCache.article_id.in_(
                select(TopicTag.article_id).where(TopicTag.tag == topic_filter)
            )
        )

    if state_filter:
        if state_filter == "new":
            stmt = stmt.where(state_alias.state.is_(None))
        else:
            stmt = stmt.where(state_alias.state == state_filter)

    if freshness_filter:
        fresh_cutoff = now - timedelta(hours=48)
        aging_cutoff = now - timedelta(hours=96)
        if freshness_filter == "fresh":
            stmt = stmt.where(ArticleCache.published_at >= fresh_cutoff)
        elif freshness_filter == "aging":
            stmt = stmt.where(
                and_(
                    ArticleCache.published_at < fresh_cutoff,
                    ArticleCache.published_at >= aging_cutoff,
                )
            )
        else:
            stmt = stmt.where(
                or_(
                    ArticleCache.published_at < aging_cutoff,
                    ArticleCache.published_at.is_(None),
                )
            )

    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            or_(
                ArticleCache.title.ilike(pattern),
                ArticleCache.summary.ilike(pattern),
            )
        )

    return stmt


@router.get("/articles/topics", response_model=ArticleTopicsResponse)
async def list_article_topics(
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
) -> ArticleTopicsResponse:
    rows = await db.execute(
        select(TopicTag.tag, func.count(TopicTag.article_id.distinct()).label("cnt"))
        .group_by(TopicTag.tag)
        .order_by(func.count(TopicTag.article_id.distinct()).desc())
        .limit(20)
    )
    return ArticleTopicsResponse(
        topics=[TopicCount(tag=tag, count=int(cnt)) for tag, cnt in rows.all()]
    )


@router.get("/articles", response_model=ArticleListResponse)
async def list_articles(
    state: StateFilter = None,
    freshness: FreshnessFilter = None,
    topic: Optional[str] = Query(None, max_length=100),
    q: Optional[str] = Query(None, max_length=200),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ArticleListResponse:
    try:
        await ensure_cache_fresh(db, settings.snapi_cache_ttl_minutes)
    except SnapiUnavailable:
        http_error(503, "snapi_unavailable", "SNAPI unavailable and cache empty.")

    now = datetime.now(timezone.utc)
    state_alias = aliased(ArticleState)
    stmt = select(ArticleCache, state_alias.state).outerjoin(
        state_alias,
        and_(
            state_alias.user_id == current_user.user_id,
            state_alias.article_id == ArticleCache.article_id,
        ),
    )
    stmt = apply_filters(stmt, state, freshness, state_alias, now, q=q, topic_filter=topic)

    count_stmt = select(func.count()).select_from(ArticleCache).outerjoin(
        state_alias,
        and_(
            state_alias.user_id == current_user.user_id,
            state_alias.article_id == ArticleCache.article_id,
        ),
    )
    count_stmt = apply_filters(count_stmt, state, freshness, state_alias, now, q=q, topic_filter=topic)
    total = int((await db.execute(count_stmt)).scalar_one())

    stmt = (
        stmt.order_by(ArticleCache.published_at.desc().nullslast())
        .limit(limit)
        .offset(offset)
    )
    rows = (await db.execute(stmt)).all()
    articles = []
    for article, state_value in rows:
        current_state = cast(
            Literal["new", "read", "explained"],
            state_value or "new",
        )
        articles.append(
            ArticleSummary(
                article_id=article.article_id,
                title=article.title,
                summary=article.summary,
                news_site=article.news_site,
                published_at=article.published_at,
                url=article.url,
                image_url=article.image_url,
                freshness=classify_freshness(article.published_at, now),
                state=current_state,
            )
        )

    return ArticleListResponse(articles=articles, total=total, limit=limit, offset=offset)


@router.get("/articles/{article_id}", response_model=ArticleDetailResponse)
async def get_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ArticleDetailResponse:
    try:
        await ensure_cache_fresh(db, settings.snapi_cache_ttl_minutes)
    except SnapiUnavailable:
        http_error(503, "snapi_unavailable", "SNAPI unavailable and cache empty.")

    article = await db.get(ArticleCache, article_id)
    if not article:
        http_error(404, "article_not_found", "Article not found in cache.")

    now = datetime.now(timezone.utc)
    state_result = await db.execute(
        select(ArticleState).where(
            ArticleState.user_id == current_user.user_id,
            ArticleState.article_id == article_id,
        )
    )
    state_row = state_result.scalar_one_or_none()
    if state_row is None:
        if not validate_transition(None, "read"):
            http_error(409, "invalid_transition", "Cannot transition article to read state.")
        state_row = ArticleState(
            user_id=current_user.user_id,
            article_id=article_id,
            state="read",
            updated_at=now,
        )
        db.add(state_row)
        await db.commit()
    current_state = cast(
        Literal["new", "read", "explained"],
        state_row.state,
    )

    explanation_rows = await db.execute(
        select(Explanation).where(
            Explanation.user_id == current_user.user_id,
            Explanation.article_id == article_id,
        )
    )
    explanations = explanation_rows.scalars().all()

    latest_by_mode: dict[str, Explanation] = {}
    for explanation in explanations:
        existing = latest_by_mode.get(explanation.mode)
        if existing is None or explanation.version > existing.version:
            latest_by_mode[explanation.mode] = explanation

    ExplanationModeKey = Literal["eli12", "caveman", "alien", "story"]
    explanation_statuses: dict[ExplanationModeKey, ExplanationStatus] = {}
    for mode in ("eli12", "caveman", "alien", "story"):
        mode_key = cast(ExplanationModeKey, mode)
        latest = latest_by_mode.get(mode)
        if latest:
            explanation_statuses[mode_key] = ExplanationStatus(
                available=True,
                latest_version=latest.version,
                needs_regeneration=latest.needs_regeneration,
                rating=cast(Optional[Literal["up", "down"]], latest.rating),
            )
        else:
            explanation_statuses[mode_key] = ExplanationStatus(
                available=False,
                latest_version=None,
                needs_regeneration=False,
                rating=None,
            )

    return ArticleDetailResponse(
        article_id=article.article_id,
        title=article.title,
        summary=article.summary,
        news_site=article.news_site,
        published_at=article.published_at,
        url=article.url,
        image_url=article.image_url,
        freshness=classify_freshness(article.published_at, now),
        state=current_state,
        explanations=explanation_statuses,
    )
