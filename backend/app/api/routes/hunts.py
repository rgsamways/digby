from datetime import UTC, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user, require_operator
from app.models.booking import Booking, BookingStatus
from app.models.hunt_progress import HuntProgress
from app.models.passport_stamp import PassportStamp
from app.models.scavenger_hunt import HuntItem, ScavengerHunt
from app.models.site import Site
from app.models.user import User

router = APIRouter()


class HuntItemIn(BaseModel):
    label: str
    hint: str = ""
    points: int = 10


class HuntCreate(BaseModel):
    site_id: str
    title: str
    description: str = ""
    items: list[HuntItemIn] = []


class HuntUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    items: list[HuntItemIn] | None = None
    is_active: bool | None = None


class ProgressUpdate(BaseModel):
    found_item_ids: list[str]


# ── Operator endpoints ────────────────────────────────────────────────────────

@router.post("/")
async def create_hunt(
    body: HuntCreate,
    operator: User = Depends(require_operator),
) -> dict:
    site = await Site.get(PydanticObjectId(body.site_id))
    if not site or site.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Site not found")

    hunt = ScavengerHunt(
        site_id=site.id,
        operator_id=operator.id,
        title=body.title,
        description=body.description,
        items=[HuntItem(label=i.label, hint=i.hint, points=i.points) for i in body.items],
    )
    await hunt.insert()
    return _hunt_dict(hunt)


@router.get("/my")
async def my_hunts(operator: User = Depends(require_operator)) -> list[dict]:
    hunts = await ScavengerHunt.find(ScavengerHunt.operator_id == operator.id).to_list()
    return [_hunt_dict(h) for h in hunts]


@router.get("/{hunt_id}")
async def get_hunt(
    hunt_id: PydanticObjectId,
    operator: User = Depends(require_operator),
) -> dict:
    hunt = await ScavengerHunt.get(hunt_id)
    if not hunt or hunt.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Hunt not found")
    return _hunt_dict(hunt)


@router.patch("/{hunt_id}")
async def update_hunt(
    hunt_id: PydanticObjectId,
    body: HuntUpdate,
    operator: User = Depends(require_operator),
) -> dict:
    hunt = await ScavengerHunt.get(hunt_id)
    if not hunt or hunt.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Hunt not found")

    updates: dict = {}
    if body.title is not None:
        updates["title"] = body.title
    if body.description is not None:
        updates["description"] = body.description
    if body.is_active is not None:
        updates["is_active"] = body.is_active
    if body.items is not None:
        updates["items"] = [
            HuntItem(label=i.label, hint=i.hint, points=i.points) for i in body.items
        ]

    if updates:
        await hunt.set(updates)
        await hunt.sync()

    return _hunt_dict(hunt)


@router.delete("/{hunt_id}")
async def delete_hunt(
    hunt_id: PydanticObjectId,
    operator: User = Depends(require_operator),
) -> dict:
    hunt = await ScavengerHunt.get(hunt_id)
    if not hunt or hunt.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Hunt not found")
    await hunt.delete()
    return {"deleted": True}


# ── Visitor endpoints ─────────────────────────────────────────────────────────

@router.get("/site/{site_id}")
async def site_hunt(
    site_id: str,
    visitor: User = Depends(get_current_user),
) -> dict:
    hunt = await ScavengerHunt.find_one(
        ScavengerHunt.site_id == PydanticObjectId(site_id),
        ScavengerHunt.is_active == True,  # noqa: E712
    )
    if not hunt:
        raise HTTPException(status_code=404, detail="No active hunt for this site")
    return _hunt_dict(hunt)


@router.post("/{hunt_id}/progress")
async def start_progress(
    hunt_id: PydanticObjectId,
    booking_id: str,
    visitor: User = Depends(get_current_user),
) -> dict:
    hunt = await ScavengerHunt.get(hunt_id)
    if not hunt:
        raise HTTPException(status_code=404, detail="Hunt not found")

    booking = await Booking.get(PydanticObjectId(booking_id))
    if not booking or booking.visitor_id != visitor.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status not in (BookingStatus.CONFIRMED, BookingStatus.COMPLETED):
        raise HTTPException(status_code=409, detail="Booking must be confirmed to start a hunt")

    existing = await HuntProgress.find_one(
        HuntProgress.hunt_id == hunt.id,
        HuntProgress.booking_id == booking.id,
    )
    if existing:
        return _progress_dict(existing)

    progress = HuntProgress(
        hunt_id=hunt.id,
        booking_id=booking.id,
        visitor_id=visitor.id,
        site_id=hunt.site_id,
    )
    await progress.insert()
    return _progress_dict(progress)


@router.get("/{hunt_id}/progress/{booking_id}")
async def get_progress(
    hunt_id: PydanticObjectId,
    booking_id: PydanticObjectId,
    visitor: User = Depends(get_current_user),
) -> dict:
    progress = await HuntProgress.find_one(
        HuntProgress.hunt_id == hunt_id,
        HuntProgress.booking_id == booking_id,
        HuntProgress.visitor_id == visitor.id,
    )
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    return _progress_dict(progress)


@router.patch("/{hunt_id}/progress/{booking_id}")
async def update_progress(
    hunt_id: PydanticObjectId,
    booking_id: PydanticObjectId,
    body: ProgressUpdate,
    visitor: User = Depends(get_current_user),
) -> dict:
    hunt = await ScavengerHunt.get(hunt_id)
    if not hunt:
        raise HTTPException(status_code=404, detail="Hunt not found")

    progress = await HuntProgress.find_one(
        HuntProgress.hunt_id == hunt_id,
        HuntProgress.booking_id == booking_id,
        HuntProgress.visitor_id == visitor.id,
    )
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    valid_ids = {item.id for item in hunt.items}
    found = [fid for fid in body.found_item_ids if fid in valid_ids]
    updates: dict = {"found_item_ids": found}

    if len(found) == len(hunt.items) and not progress.completed_at:
        updates["completed_at"] = datetime.now(UTC)

        if not progress.stamp_awarded:
            updates["stamp_awarded"] = True
            site = await Site.get(hunt.site_id)
            booking = await Booking.get(progress.booking_id)
            existing_stamp = await PassportStamp.find_one(
                PassportStamp.visitor_id == visitor.id,
                PassportStamp.booking_id == progress.booking_id,
            )
            if not existing_stamp and site and booking:
                stamp = PassportStamp(
                    visitor_id=visitor.id,
                    site_id=hunt.site_id,
                    site_name=site.name,
                    minerals_found=[item.label for item in hunt.items],
                    visited_at=booking.date,
                    booking_id=progress.booking_id,
                )
                await stamp.insert()

    await progress.set(updates)
    await progress.sync()
    return _progress_dict(progress)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _hunt_dict(h: ScavengerHunt) -> dict:
    return {
        "id": str(h.id),
        "site_id": str(h.site_id),
        "operator_id": str(h.operator_id),
        "title": h.title,
        "description": h.description,
        "is_active": h.is_active,
        "items": [
            {"id": i.id, "label": i.label, "hint": i.hint, "points": i.points} for i in h.items
        ],
        "created_at": h.created_at.isoformat(),
    }


def _progress_dict(p: HuntProgress) -> dict:
    return {
        "id": str(p.id),
        "hunt_id": str(p.hunt_id),
        "booking_id": str(p.booking_id),
        "found_item_ids": p.found_item_ids,
        "completed_at": p.completed_at.isoformat() if p.completed_at else None,
        "stamp_awarded": p.stamp_awarded,
    }
