from datetime import date

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.site import Site
from app.models.user import User
from app.models.waitlist_entry import WaitlistEntry

router = APIRouter()


class WaitlistJoin(BaseModel):
    site_id: str
    date: date


def _entry_dict(e: WaitlistEntry, site_name: str = "") -> dict:
    return {
        "id": str(e.id),
        "site_id": str(e.site_id),
        "site_name": site_name,
        "date": e.date.isoformat(),
        "notified_at": e.notified_at.isoformat() if e.notified_at else None,
        "created_at": e.created_at.isoformat(),
    }


@router.post("/")
async def join_waitlist(
    body: WaitlistJoin,
    visitor: User = Depends(get_current_user),
) -> dict:
    site_oid = PydanticObjectId(body.site_id)
    site = await Site.get(site_oid)
    if not site or not site.is_active:
        raise HTTPException(status_code=404, detail="Site not found")

    existing = await WaitlistEntry.find_one(
        WaitlistEntry.site_id == site_oid,
        WaitlistEntry.date == body.date,
        WaitlistEntry.visitor_id == visitor.id,
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already on waitlist for this date")

    entry = WaitlistEntry(
        site_id=site_oid,
        date=body.date,
        visitor_id=visitor.id,
        email=visitor.email,
    )
    await entry.insert()
    return _entry_dict(entry, site.name)


@router.get("/my")
async def my_waitlist(visitor: User = Depends(get_current_user)) -> list[dict]:
    entries = await WaitlistEntry.find(
        WaitlistEntry.visitor_id == visitor.id,
    ).sort(WaitlistEntry.date).to_list()

    result = []
    for e in entries:
        site = await Site.get(e.site_id)
        result.append(_entry_dict(e, site.name if site else ""))
    return result


@router.delete("/{entry_id}")
async def leave_waitlist(
    entry_id: PydanticObjectId,
    visitor: User = Depends(get_current_user),
) -> dict:
    entry = await WaitlistEntry.get(entry_id)
    if not entry or entry.visitor_id != visitor.id:
        raise HTTPException(status_code=404, detail="Not found")
    await entry.delete()
    return {"removed": True}
