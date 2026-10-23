import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import httpx
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article_cache import ArticleCache

logger = logging.getLogger(__name__)

SNAPI_BASE_URL = "https://api.spaceflightnewsapi.net/v4/articles/"
SNAPI_PAGE_LIMIT = 100
SNAPI_MAX_PAGES = 5


class SnapiUnavailable(RuntimeError):
    pass


def parse_published_at(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def classify_freshness(published_at: datetime | None, now: datetime) -> Literal["fresh", "aging", "archived"]:
    if published_at is None:
        return "archived"
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    delta = now - published_at
    if delta <= timedelta(hours=48):
        return "fresh"
    if delta <= timedelta(hours=96):
        return "aging"
    return "archived"


async def fetch_snapi_articles() -> list[dict[str, Any]]:
    articles: list[dict[str, Any]] = []
    url = SNAPI_BASE_URL
    params: dict[str, int] | None = {"limit": SNAPI_PAGE_LIMIT, "offset": 0}
    pages_fetched = 0
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            while url and pages_fetched < SNAPI_MAX_PAGES:
                response = await client.get(url, params=params)
                if response.status_code == 429:
                    logger.warning("SNAPI rate-limited after %d pages; using partial results", pages_fetched)
                    break
                response.raise_for_status()
                try:
                    payload = response.json()
                except ValueError as exc:
                    raise SnapiUnavailable("Invalid SNAPI response") from exc
                articles.extend(payload.get("results", []))
                url = payload.get("next")
                params = None
                pages_fetched += 1
    except httpx.HTTPError as exc:
        raise SnapiUnavailable(str(exc)) from exc
    return articles


async def get_cache_stats(session: AsyncSession) -> tuple[int, datetime | None]:
    result = await session.execute(
        select(func.count(ArticleCache.article_id), func.max(ArticleCache.cached_at))
    )
    count, max_cached_at = result.one()
    return int(count), max_cached_at


async def refresh_cache(session: AsyncSession) -> None:
    now = datetime.now(timezone.utc)
    raw_articles = await fetch_snapi_articles()
    if not raw_articles:
        logger.warning("SNAPI returned no articles during refresh")
        return

    records: list[dict[str, Any]] = []
    seen_ids: set[int] = set()
    for article in raw_articles:
        article_id = article.get("id")
        title = article.get("title")
        if article_id is None or title is None:
            continue
        if article_id in seen_ids:
            continue
        seen_ids.add(article_id)
        records.append(
            {
                "article_id": article_id,
                "title": title,
                "summary": article.get("summary"),
                "news_site": article.get("news_site"),
                "url": article.get("url"),
                "image_url": article.get("image_url"),
                "published_at": parse_published_at(article.get("published_at")),
                "cached_at": now,
            }
        )

    if not records:
        logger.warning("SNAPI refresh returned no usable articles")
        return

    stmt = insert(ArticleCache).values(records)
    update_cols = {
        "title": stmt.excluded.title,
        "summary": stmt.excluded.summary,
        "news_site": stmt.excluded.news_site,
        "url": stmt.excluded.url,
        "image_url": stmt.excluded.image_url,
        "published_at": stmt.excluded.published_at,
        "cached_at": stmt.excluded.cached_at,
    }
    stmt = stmt.on_conflict_do_update(
        index_elements=[ArticleCache.article_id],
        set_=update_cols,
    )
    await session.execute(stmt)
    await session.commit()


async def ensure_cache_fresh(session: AsyncSession, ttl_minutes: int) -> None:
    count, max_cached_at = await get_cache_stats(session)
    now = datetime.now(timezone.utc)
    stale = max_cached_at is None or (now - max_cached_at) > timedelta(minutes=ttl_minutes)
    if not stale:
        return

    try:
        await refresh_cache(session)
    except SnapiUnavailable:
        if count == 0:
            raise
        logger.warning("SNAPI unreachable; serving stale cache")
