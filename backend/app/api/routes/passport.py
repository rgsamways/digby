from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.passport_stamp import PassportStamp
from app.models.user import User

router = APIRouter()

BADGES = [
    {"id": "first_dig", "name": "First Dig", "description": "Complete your first site visit", "threshold": 1},
    {"id": "rock_hound", "name": "Rock Hound", "description": "Visit 5 sites", "threshold": 5},
    {"id": "gem_hunter", "name": "Gem Hunter", "description": "Visit 10 sites", "threshold": 10},
    {"id": "mineral_master", "name": "Mineral Master", "description": "Visit 25 sites", "threshold": 25},
]


@router.get("/me")
async def my_passport(visitor: User = Depends(get_current_user)) -> dict:
    stamps = await PassportStamp.find(
        PassportStamp.visitor_id == visitor.id
    ).sort(-PassportStamp.visited_at).to_list()

    earned_badges = [
        b for b in BADGES if len(stamps) >= b["threshold"]
    ]

    # unique minerals found across all visits
    all_minerals: set[str] = set()
    for s in stamps:
        all_minerals.update(s.minerals_found)

    return {
        "visitor_name": visitor.name,
        "total_visits": len(stamps),
        "unique_minerals": sorted(all_minerals),
        "badges": earned_badges,
        "stamps": [_stamp_dict(s) for s in stamps],
    }


@router.get("/{visitor_id}")
async def get_passport(visitor_id: str) -> dict:
    stamps = await PassportStamp.find(
        PassportStamp.visitor_id == PydanticObjectId(visitor_id)
    ).sort(-PassportStamp.visited_at).to_list()

    earned_badges = [b for b in BADGES if len(stamps) >= b["threshold"]]
    all_minerals: set[str] = set()
    for s in stamps:
        all_minerals.update(s.minerals_found)

    return {
        "total_visits": len(stamps),
        "unique_minerals": sorted(all_minerals),
        "badges": earned_badges,
        "stamps": [_stamp_dict(s) for s in stamps],
    }


class StampCreate(BaseModel):
    booking_id: str
    site_id: str
    site_name: str
    minerals_found: list[str] = []
    visited_at: str


@router.post("/stamp")
async def add_stamp(
    body: StampCreate,
    visitor: User = Depends(get_current_user),
) -> dict:
    from datetime import datetime
    existing = await PassportStamp.find_one(
        PassportStamp.visitor_id == visitor.id,
        PassportStamp.booking_id == PydanticObjectId(body.booking_id),
    )
    if existing:
        raise HTTPException(status_code=409, detail="Stamp already exists for this booking")

    stamp = PassportStamp(
        visitor_id=visitor.id,
        site_id=PydanticObjectId(body.site_id),
        site_name=body.site_name,
        minerals_found=body.minerals_found,
        visited_at=datetime.fromisoformat(body.visited_at),
        booking_id=PydanticObjectId(body.booking_id),
    )
    await stamp.insert()
    return _stamp_dict(stamp)


def _stamp_dict(s: PassportStamp) -> dict:
    return {
        "id": str(s.id),
        "site_id": str(s.site_id),
        "site_name": s.site_name,
        "minerals_found": s.minerals_found,
        "visited_at": s.visited_at.isoformat(),
        "booking_id": str(s.booking_id),
    }
