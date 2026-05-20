from datetime import UTC, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.booking import Booking, BookingStatus
from app.models.diary_entry import DiaryEntry
from app.models.site import Site
from app.models.user import User

router = APIRouter()

DIARY_POINTS = 15


class DiaryCreate(BaseModel):
    booking_id: str
    title: str
    body: str = ""
    minerals_found: list[str] = []
    photo_urls: list[str] = []
    is_public: bool = True


class DiaryUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    minerals_found: list[str] | None = None
    photo_urls: list[str] | None = None
    is_public: bool | None = None


@router.post("/")
async def create_entry(
    body: DiaryCreate,
    visitor: User = Depends(get_current_user),
) -> dict:
    booking = await Booking.get(PydanticObjectId(body.booking_id))
    if not booking or booking.visitor_id != visitor.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status not in (BookingStatus.CONFIRMED, BookingStatus.COMPLETED):
        raise HTTPException(status_code=409, detail="Booking must be confirmed or completed")

    existing = await DiaryEntry.find_one(
        DiaryEntry.booking_id == booking.id,
        DiaryEntry.visitor_id == visitor.id,
    )
    if existing:
        raise HTTPException(status_code=409, detail="Journal entry already exists for this booking")

    site = await Site.get(booking.site_id)
    site_name = site.name if site else "Unknown site"

    entry = DiaryEntry(
        visitor_id=visitor.id,
        booking_id=booking.id,
        site_id=booking.site_id,
        site_name=site_name,
        visit_date=booking.date,
        title=body.title,
        body=body.body,
        minerals_found=body.minerals_found,
        photo_urls=body.photo_urls,
        is_public=body.is_public,
        points_awarded=DIARY_POINTS if body.is_public else 0,
    )
    await entry.insert()
    return _entry_dict(entry, visitor.name)


@router.get("/my")
async def my_entries(visitor: User = Depends(get_current_user)) -> list[dict]:
    entries = await DiaryEntry.find(
        DiaryEntry.visitor_id == visitor.id
    ).sort(-DiaryEntry.visit_date).to_list()
    return [_entry_dict(e, visitor.name) for e in entries]


@router.get("/feed")
async def public_feed() -> list[dict]:
    entries = await DiaryEntry.find(
        DiaryEntry.is_public == True  # noqa: E712
    ).sort(-DiaryEntry.created_at).limit(30).to_list()

    result = []
    for e in entries:
        user = await User.get(e.visitor_id)
        result.append(_entry_dict(e, user.name if user else "Rockhound"))
    return result


@router.get("/site/{site_id}")
async def site_entries(site_id: str) -> list[dict]:
    entries = await DiaryEntry.find(
        DiaryEntry.site_id == PydanticObjectId(site_id),
        DiaryEntry.is_public == True,  # noqa: E712
    ).sort(-DiaryEntry.visit_date).limit(10).to_list()

    result = []
    for e in entries:
        user = await User.get(e.visitor_id)
        result.append(_entry_dict(e, user.name if user else "Rockhound"))
    return result


@router.get("/booking/{booking_id}")
async def entry_for_booking(
    booking_id: str,
    visitor: User = Depends(get_current_user),
) -> dict | None:
    entry = await DiaryEntry.find_one(
        DiaryEntry.booking_id == PydanticObjectId(booking_id),
        DiaryEntry.visitor_id == visitor.id,
    )
    if not entry:
        return None
    return _entry_dict(entry, visitor.name)


@router.get("/{entry_id}")
async def get_entry(entry_id: PydanticObjectId) -> dict:
    entry = await DiaryEntry.get(entry_id)
    if not entry or not entry.is_public:
        raise HTTPException(status_code=404, detail="Entry not found")
    user = await User.get(entry.visitor_id)
    return _entry_dict(entry, user.name if user else "Rockhound")


@router.patch("/{entry_id}")
async def update_entry(
    entry_id: PydanticObjectId,
    body: DiaryUpdate,
    visitor: User = Depends(get_current_user),
) -> dict:
    entry = await DiaryEntry.get(entry_id)
    if not entry or entry.visitor_id != visitor.id:
        raise HTTPException(status_code=404, detail="Entry not found")

    updates: dict = {"updated_at": datetime.now(UTC)}
    if body.title is not None:
        updates["title"] = body.title
    if body.body is not None:
        updates["body"] = body.body
    if body.minerals_found is not None:
        updates["minerals_found"] = body.minerals_found
    if body.photo_urls is not None:
        updates["photo_urls"] = body.photo_urls
    if body.is_public is not None:
        updates["is_public"] = body.is_public
        updates["points_awarded"] = DIARY_POINTS if body.is_public else 0

    await entry.set(updates)
    await entry.sync()
    return _entry_dict(entry, visitor.name)


@router.delete("/{entry_id}")
async def delete_entry(
    entry_id: PydanticObjectId,
    visitor: User = Depends(get_current_user),
) -> dict:
    entry = await DiaryEntry.get(entry_id)
    if not entry or entry.visitor_id != visitor.id:
        raise HTTPException(status_code=404, detail="Entry not found")
    await entry.delete()
    return {"deleted": True}


def _entry_dict(e: DiaryEntry, visitor_name: str) -> dict:
    return {
        "id": str(e.id),
        "visitor_name": visitor_name,
        "booking_id": str(e.booking_id),
        "site_id": str(e.site_id),
        "site_name": e.site_name,
        "visit_date": e.visit_date.isoformat(),
        "title": e.title,
        "body": e.body,
        "minerals_found": e.minerals_found,
        "photo_urls": e.photo_urls,
        "is_public": e.is_public,
        "points_awarded": e.points_awarded,
        "created_at": e.created_at.isoformat(),
    }
