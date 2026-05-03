import pytest

from app.services.state_machine import validate_transition


@pytest.mark.parametrize(
    "from_state,to_state",
    [
        (None, "read"),
        ("read", "explained"),
        ("read", "saved"),
        ("read", "dismissed"),
        ("explained", "saved"),
        ("explained", "dismissed"),
        ("saved", "dismissed"),
        ("dismissed", "saved"),
    ],
)
def test_valid_transitions(from_state: object, to_state: str) -> None:
    assert validate_transition(from_state, to_state) is True


@pytest.mark.parametrize(
    "from_state,to_state",
    [
        (None, "saved"),
        (None, "dismissed"),
        (None, "explained"),
        ("read", "new"),
        ("explained", "read"),
        ("explained", "new"),
        ("saved", "read"),
        ("saved", "new"),
        ("dismissed", "read"),
        ("dismissed", "new"),
        ("dismissed", "explained"),
    ],
)
def test_invalid_transitions(from_state: object, to_state: str) -> None:
    assert validate_transition(from_state, to_state) is False
