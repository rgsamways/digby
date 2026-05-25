"""Unit tests for JWT and password hashing — no DB required."""
import os

import pytest

os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017/digby_test")
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production-use-64chars-padded-xx")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_ci")

from app.core.security import create_access_token, decode_token, hash_password, verify_password


def test_password_hash_roundtrip():
    hashed = hash_password("hunter2")
    assert verify_password("hunter2", hashed)


def test_wrong_password_rejected():
    hashed = hash_password("correcthorse")
    assert not verify_password("wrongpassword", hashed)


def test_token_roundtrip():
    token = create_access_token(subject="user-123", role="visitor")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "visitor"


def test_tampered_token_rejected():
    token = create_access_token(subject="user-123", role="visitor")
    bad = token[:-4] + "xxxx"
    with pytest.raises(ValueError, match="Invalid token"):
        decode_token(bad)


def test_token_contains_role():
    token = create_access_token(subject="op-456", role="operator")
    payload = decode_token(token)
    assert payload["role"] == "operator"
