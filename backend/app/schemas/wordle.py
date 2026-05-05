from pydantic import BaseModel


class WordleWordsResponse(BaseModel):
    words: list[str]
