import pytest

from app.services.state_machine import validate_transition


@pytest.mark.parametrize(
    "from_state,to_state",
    [
        (None, "read"),
        ("read", "explained"),
    ],
)
def test_valid_transitions(from_state: object, to_state: str) -> None:
    assert validate_transition(from_state, to_state) is True


@pytest.mark.parametrize(
    "from_state,to_state",
    [
        (None, "explained"),
        (None, "new"),
        ("read", "new"),
        ("read", "read"),
        ("explained", "read"),
        ("explained", "new"),
        ("explained", "explained"),
    ],
)
def test_invalid_transitions(from_state: object, to_state: str) -> None:
    assert validate_transition(from_state, to_state) is False
