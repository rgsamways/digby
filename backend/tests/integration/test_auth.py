"""Integration tests for auth endpoints — uses real MongoDB test DB."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_new_user(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "email": "newuser_auth_test@digby.rocks",
        "name": "Auth Tester",
        "password": "secure123",
        "role": "visitor",
    })
    # 201 on first run, 409 on repeat runs (idempotent CI)
    assert resp.status_code in (201, 409)


@pytest.mark.asyncio
async def test_login_valid_credentials(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "logintest@digby.rocks",
        "name": "Login Tester",
        "password": "mypassword",
        "role": "visitor",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "logintest@digby.rocks",
        "password": "mypassword",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "wrongpw@digby.rocks",
        "name": "Wrong PW",
        "password": "correctpass",
        "role": "visitor",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "wrongpw@digby.rocks",
        "password": "badpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    resp = await client.post("/api/auth/login", json={
        "email": "nobody@digby.rocks",
        "password": "whatever",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client: AsyncClient):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_me_returns_user(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert "role" in data
