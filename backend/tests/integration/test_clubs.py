"""Integration tests for the clubs API."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_club(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/clubs/", json={
        "name": "Test Rockhounds CI",
        "description": "Created by automated tests",
        "is_public": True,
    }, headers=auth_headers)
    # 201 first run, possibly repeated in CI so accept existing slug too
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Rockhounds CI"
    assert "slug" in data
    assert data["member_count"] == 1  # creator auto-joined as owner


@pytest.mark.asyncio
async def test_list_clubs(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/clubs/", headers=auth_headers)
    assert resp.status_code == 200
    clubs = resp.json()
    assert isinstance(clubs, list)
    assert len(clubs) >= 1


@pytest.mark.asyncio
async def test_my_clubs(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/clubs/mine", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    # Creator should be in at least one club
    assert any(c["role"] == "owner" for c in data)


@pytest.mark.asyncio
async def test_get_club_detail(client: AsyncClient, auth_headers: dict):
    # Create a club first, then fetch its detail
    create = await client.post("/api/clubs/", json={
        "name": "Detail Test Club CI",
        "description": "",
        "is_public": True,
    }, headers=auth_headers)
    slug = create.json()["slug"]

    resp = await client.get(f"/api/clubs/{slug}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == slug
    assert "members" in data
    assert "recent_finds" in data


@pytest.mark.asyncio
async def test_join_and_leave_club(client: AsyncClient, auth_headers: dict):
    # Register a second user to join the club
    await client.post("/api/auth/register", json={
        "email": "club_joiner@digby.rocks",
        "name": "Club Joiner",
        "password": "joinpass",
        "role": "visitor",
    })
    login = await client.post("/api/auth/login", json={
        "email": "club_joiner@digby.rocks",
        "password": "joinpass",
    })
    joiner_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    # Create club as original user
    create = await client.post("/api/clubs/", json={
        "name": "Join Leave Test CI",
        "is_public": True,
    }, headers=auth_headers)
    slug = create.json()["slug"]

    # Second user joins
    join = await client.post(f"/api/clubs/{slug}/join", headers=joiner_headers)
    assert join.status_code == 201

    # Duplicate join should 409
    dup = await client.post(f"/api/clubs/{slug}/join", headers=joiner_headers)
    assert dup.status_code == 409

    # Second user leaves
    leave = await client.delete(f"/api/clubs/{slug}/leave", headers=joiner_headers)
    assert leave.status_code == 200


@pytest.mark.asyncio
async def test_clubs_require_auth(client: AsyncClient):
    resp = await client.get("/api/clubs/")
    assert resp.status_code == 403
