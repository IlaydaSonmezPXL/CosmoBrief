from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article_state import ArticleState
from app.models.explanation import Explanation
from app.models.topic_tag import TopicTag
from app.services.openai_client import generate_explanation


async def get_or_generate_explanation(
    session: AsyncSession,
    user_id: UUID,
    article_id: int,
    mode: str,
    title: str,
    summary: str | None,
) -> tuple[Explanation, str]:
    result = await session.execute(
        select(Explanation)
        .where(
            Explanation.user_id == user_id,
            Explanation.article_id == article_id,
            Explanation.mode == mode,
        )
        .order_by(Explanation.version.desc())
        .limit(1)
        .with_for_update()
    )
    latest = result.scalar_one_or_none()
    if latest and not latest.needs_regeneration:
        return latest, "cached"

    next_version = 1 if latest is None else latest.version + 1
    explanation_text, topic_tag, usage = await generate_explanation(title, summary, mode)

    now = datetime.now(timezone.utc)
    new_explanation = Explanation(
        user_id=user_id,
        article_id=article_id,
        mode=mode,
        version=next_version,
        text=explanation_text,
        generated_at=now,
        rating=None,
        needs_regeneration=False,
        prompt_tokens=usage.prompt_tokens,
        completion_tokens=usage.completion_tokens,
    )
    session.add(new_explanation)

    state_result = await session.execute(
        select(ArticleState).where(
            ArticleState.user_id == user_id,
            ArticleState.article_id == article_id,
        )
    )
    state_row = state_result.scalar_one_or_none()
    if state_row is None:
        session.add(
            ArticleState(
                user_id=user_id,
                article_id=article_id,
                state="explained",
                updated_at=now,
            )
        )
    elif state_row.state not in {"saved", "dismissed"}:
        state_row.state = "explained"
        state_row.updated_at = now

    tag_result = await session.execute(
        select(TopicTag).where(
            TopicTag.user_id == user_id,
            TopicTag.article_id == article_id,
        )
    )
    tag_row = tag_result.scalar_one_or_none()
    if tag_row is None:
        session.add(
            TopicTag(
                user_id=user_id,
                article_id=article_id,
                tag=topic_tag,
            )
        )

    await session.commit()
    return new_explanation, "generated"
