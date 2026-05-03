from typing import Optional

ArticleState = Optional[str]

VALID_TRANSITIONS = {
    (None, "read"),
    ("read", "explained"),
    ("read", "saved"),
    ("read", "dismissed"),
    ("explained", "saved"),
    ("explained", "dismissed"),
    ("saved", "dismissed"),
    ("dismissed", "saved"),
}


def validate_transition(from_state: ArticleState, to_state: str) -> bool:
    return (from_state, to_state) in VALID_TRANSITIONS
