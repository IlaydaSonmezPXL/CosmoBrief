from dataclasses import dataclass
from typing import Optional

from openai import AsyncOpenAI
from pydantic import BaseModel

from app.config import settings


class ExplanationOutput(BaseModel):
    explanation: str
    topic_tag: str


MODE_INSTRUCTIONS = {
    "eli12": "as if explaining to a 12-year-old, using simple words and relatable comparisons",
    "caveman": "using only very simple words, short sentences, and primitive concepts as if speaking to a caveman",
    "alien": "as an alien visitor reporting this human space news back to your home planet. Use alien exclamations like 'Glorp!' and 'Zlorp!' naturally throughout. Express bewildered curiosity about human concepts, occasionally misunderstand Earth things in funny ways, and pepper the explanation with alien slang (glorp, zlorp, florpnax, bleeble, snorkvax). Write as if humans discovering space is both adorable and slightly baffling to your ancient civilization.",
    "story": "as a short compelling narrative story, with a beginning, middle, and end",
}


@dataclass(frozen=True)
class OpenAIUsage:
    prompt_tokens: Optional[int]
    completion_tokens: Optional[int]


client = AsyncOpenAI(api_key=settings.openai_api_key)


async def generate_explanation(title: str, summary: str | None, mode: str) -> tuple[str, str, OpenAIUsage]:
    mode_instruction = MODE_INSTRUCTIONS[mode]
    system_prompt = (
        "You are a helpful assistant that explains space news articles. "
        f"Explain the following article {mode_instruction}. "
        "Also identify a single short topic tag for this article (e.g. \"Mars\", \"Artemis\", "
        "\"Black Holes\", \"SpaceX\", \"James Webb\"). "
        "Respond only in JSON with the following structure: "
        "{\"explanation\": \"...\", \"topic_tag\": \"...\"}"
    )
    user_content = f"Title: {title}\nSummary: {summary or 'No summary provided.'}"

    response = await client.beta.chat.completions.parse(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        response_format=ExplanationOutput,
    )

    parsed = response.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response missing parsed output")

    usage = OpenAIUsage(
        prompt_tokens=getattr(response.usage, "prompt_tokens", None),
        completion_tokens=getattr(response.usage, "completion_tokens", None),
    )
    return parsed.explanation, parsed.topic_tag, usage
