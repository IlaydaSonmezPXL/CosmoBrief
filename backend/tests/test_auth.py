import uuid

import jwt
import pytest

from app.services.auth_service import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_password_not_plaintext() -> None:
    h = hash_password("mysecret")
    assert h != "mysecret"
    assert h.startswith("$2")


def test_verify_password_correct() -> None:
    h = hash_password("correct")
    assert verify_password("correct", h) is True


def test_verify_password_wrong() -> None:
    h = hash_password("correct")
    assert verify_password("wrong", h) is False


def test_token_roundtrip() -> None:
    user_id = uuid.uuid4()
    token = create_access_token(user_id, "user")
    payload = decode_access_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "user"


def test_token_admin_role() -> None:
    user_id = uuid.uuid4()
    token = create_access_token(user_id, "admin")
    payload = decode_access_token(token)
    assert payload["role"] == "admin"


def test_decode_invalid_token_raises() -> None:
    with pytest.raises(jwt.exceptions.InvalidTokenError):
        decode_access_token("not.a.valid.token")


def test_decode_tampered_token_raises() -> None:
    user_id = uuid.uuid4()
    token = create_access_token(user_id, "user")
    tampered = token[:-4] + "XXXX"
    with pytest.raises(jwt.exceptions.InvalidTokenError):
        decode_access_token(tampered)
