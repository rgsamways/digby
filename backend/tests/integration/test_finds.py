"""Integration tests for the find journal API."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_find(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/finds/", json={
        "mineral_name": "Calcite",
        "date": "2026-05-01",
        "notes": "Nice rhombohedral crystals",
        "geological_province": "Grenville",
        "visibility": "public",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["mineral_name"] == "Calcite"
    assert data["verification_status"] == "unverified"
    return data["id"]


@pytest.mark.asyncio
async def test_find_feed_returns_list(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/finds/feed", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_my_finds(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/finds/my", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    # After creating a find in test_create_find, at least one should exist
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_create_find_requires_auth(client: AsyncClient):
    resp = await client.post("/api/finds/", json={
        "mineral_name": "Quartz",
        "date": "2026-05-01",
    })
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_geojson_export(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/finds/export/geojson", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data


@pytest.mark.asyncio
async def test_bulk_import(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/finds/import", json={
        "finds": [
            {
                "mineral_name": "Pyrite",
                "date": "2025-08-15",
                "geological_province": "Superior",
            },
            {
                "mineral_name": "Magnetite",
                "date": "2025-09-01",
            },
        ]
    }, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert data["created"] >= 0
