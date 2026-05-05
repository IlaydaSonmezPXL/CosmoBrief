from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import get_current_user
from app.models.wordle_word import WordleWord
from app.schemas.wordle import WordleWordsResponse

router = APIRouter(tags=["wordle"])


@router.get("/wordle/words", response_model=WordleWordsResponse)
async def get_wordle_words(
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
) -> WordleWordsResponse:
    result = await db.execute(select(WordleWord).order_by(WordleWord.id))
    words = [row.word for row in result.scalars().all()]
    return WordleWordsResponse(words=words)
