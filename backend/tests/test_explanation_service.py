import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.article_state import ArticleState
from app.models.explanation import Explanation
from app.models.topic_tag import TopicTag
from app.services.explanation_service import get_or_generate_explanation
from app.services.openai_client import OpenAIUsage


def _make_scalar_result(value: object) -> MagicMock:
    r = MagicMock()
    r.scalar_one_or_none.return_value = value
    return r


def _make_session(execute_returns: list[object]) -> AsyncMock:
    session = AsyncMock()
    session.begin = MagicMock()
    session.begin.return_value.__aenter__ = AsyncMock(return_value=None)
    session.begin.return_value.__aexit__ = AsyncMock(return_value=False)
    session.execute = AsyncMock(side_effect=execute_returns)
    session.add = MagicMock()
    return session


FAKE_USAGE = OpenAIUsage(prompt_tokens=100, completion_tokens=50)
FAKE_GENERATION = ("Space is big.", "Mars", FAKE_USAGE)


@pytest.mark.asyncio
async def test_no_existing_explanation_generates_new() -> None:
    session = _make_session([
        _make_scalar_result(None),  # no existing explanation
        _make_scalar_result(None),  # no article state
        _make_scalar_result(None),  # no topic tag
    ])
    user_id = uuid.uuid4()

    with patch("app.services.explanation_service.generate_explanation", new=AsyncMock(return_value=FAKE_GENERATION)):
        explanation, source = await get_or_generate_explanation(
            session, user_id, 123, "eli12", "Title", "Summary"
        )

    assert source == "generated"
    assert explanation.version == 1
    assert explanation.text == "Space is big."
    assert explanation.prompt_tokens == 100
    assert explanation.completion_tokens == 50
    assert session.add.call_count == 3  # explanation + article_state + topic_tag


@pytest.mark.asyncio
async def test_cached_explanation_returned_without_generation() -> None:
    existing = Explanation(
        user_id=uuid.uuid4(),
        article_id=123,
        mode="eli12",
        version=2,
        text="Cached text.",
        generated_at=datetime.now(timezone.utc),
        rating=None,
        needs_regeneration=False,
        prompt_tokens=80,
        completion_tokens=40,
    )
    session = _make_session([_make_scalar_result(existing)])
    user_id = uuid.uuid4()

    with patch("app.services.explanation_service.generate_explanation", new=AsyncMock()) as mock_gen:
        explanation, source = await get_or_generate_explanation(
            session, user_id, 123, "eli12", "Title", "Summary"
        )
        mock_gen.assert_not_called()

    assert source == "cached"
    assert explanation is existing


@pytest.mark.asyncio
async def test_needs_regeneration_generates_incremented_version() -> None:
    existing = Explanation(
        user_id=uuid.uuid4(),
        article_id=123,
        mode="caveman",
        version=1,
        text="Old text.",
        generated_at=datetime.now(timezone.utc),
        rating="down",
        needs_regeneration=True,
        prompt_tokens=80,
        completion_tokens=40,
    )
    session = _make_session([
        _make_scalar_result(existing),
        _make_scalar_result(None),
        _make_scalar_result(None),
    ])
    user_id = uuid.uuid4()

    with patch("app.services.explanation_service.generate_explanation", new=AsyncMock(return_value=FAKE_GENERATION)):
        explanation, source = await get_or_generate_explanation(
            session, user_id, 123, "caveman", "Title", "Summary"
        )

    assert source == "generated"
    assert explanation.version == 2


@pytest.mark.asyncio
async def test_saved_state_not_overwritten_on_generation() -> None:
    saved_state = ArticleState(
        user_id=uuid.uuid4(),
        article_id=123,
        state="saved",
        updated_at=datetime.now(timezone.utc),
    )
    session = _make_session([
        _make_scalar_result(None),        # no existing explanation
        _make_scalar_result(saved_state), # article state is saved
        _make_scalar_result(None),        # no topic tag
    ])

    with patch("app.services.explanation_service.generate_explanation", new=AsyncMock(return_value=FAKE_GENERATION)):
        await get_or_generate_explanation(
            session, uuid.uuid4(), 123, "story", "Title", "Summary"
        )

    assert saved_state.state == "saved"


@pytest.mark.asyncio
async def test_dismissed_state_not_overwritten_on_generation() -> None:
    dismissed_state = ArticleState(
        user_id=uuid.uuid4(),
        article_id=123,
        state="dismissed",
        updated_at=datetime.now(timezone.utc),
    )
    session = _make_session([
        _make_scalar_result(None),
        _make_scalar_result(dismissed_state),
        _make_scalar_result(None),
    ])

    with patch("app.services.explanation_service.generate_explanation", new=AsyncMock(return_value=FAKE_GENERATION)):
        await get_or_generate_explanation(
            session, uuid.uuid4(), 123, "scientist", "Title", "Summary"
        )

    assert dismissed_state.state == "dismissed"


@pytest.mark.asyncio
async def test_read_state_transitions_to_explained_on_generation() -> None:
    read_state = ArticleState(
        user_id=uuid.uuid4(),
        article_id=123,
        state="read",
        updated_at=datetime.now(timezone.utc),
    )
    session = _make_session([
        _make_scalar_result(None),
        _make_scalar_result(read_state),
        _make_scalar_result(None),
    ])

    with patch("app.services.explanation_service.generate_explanation", new=AsyncMock(return_value=FAKE_GENERATION)):
        await get_or_generate_explanation(
            session, uuid.uuid4(), 123, "eli12", "Title", "Summary"
        )

    assert read_state.state == "explained"


@pytest.mark.asyncio
async def test_existing_topic_tag_not_duplicated() -> None:
    existing_tag = TopicTag(
        user_id=uuid.uuid4(),
        article_id=123,
        tag="Mars",
    )
    session = _make_session([
        _make_scalar_result(None),
        _make_scalar_result(None),
        _make_scalar_result(existing_tag),
    ])

    with patch("app.services.explanation_service.generate_explanation", new=AsyncMock(return_value=FAKE_GENERATION)):
        await get_or_generate_explanation(
            session, uuid.uuid4(), 123, "eli12", "Title", "Summary"
        )

    # only explanation + article_state added, topic_tag not added again
    assert session.add.call_count == 2
