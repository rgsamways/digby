"""
Shared fixtures for all test layers.

Integration tests use a real MongoDB at MONGODB_URL (set to a test DB in CI).
The `client` fixture initialises Beanie and provides an AsyncClient wired to the
FastAPI app via ASGI transport — no network port required.
"""
import os

import pytest
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017/digby_test")
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production-use-64chars-padded-xx")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_ci")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "test")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test")
os.environ.setdefault("AWS_S3_BUCKET", "test-bucket")
os.environ.setdefault("AWS_S3_REGION", "ca-central-1")
os.environ.setdefault("ANTHROPIC_API_KEY", "test")
os.environ.setdefault("ADMIN_PASSWORD", "test-admin-password")

from app.core.database import close_db, init_db  # noqa: E402 — must follow env setup
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
async def client():
    """ASGI test client with a live Beanie/MongoDB connection."""
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    await close_db()


@pytest.fixture(scope="session")
async def registered_user(client: AsyncClient) -> dict:
    """Register and return a visitor user + auth token."""
    resp = await client.post("/api/auth/register", json={
        "email": "testvisitor@digby.rocks",
        "name": "Test Visitor",
        "password": "testpassword123",
        "role": "visitor",
    })
    if resp.status_code == 409:
        resp = await client.post("/api/auth/login", json={
            "email": "testvisitor@digby.rocks",
            "password": "testpassword123",
        })
    data = resp.json()
    return {"token": data["access_token"], "user": data.get("user", {})}


@pytest.fixture(scope="session")
def auth_headers(registered_user: dict) -> dict:
    return {"Authorization": f"Bearer {registered_user['token']}"}
