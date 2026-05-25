from datetime import date

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import require_operator
from app.models.availability import Availability
from app.models.site import Site
from app.models.user import User

router = APIRouter()


class AvailabilitySet(BaseModel):
    date: date
    slots_total: int
    is_blocked: bool = False


@router.get("/operator")
async def operator_availability(operator: User = Depends(require_operator)) -> list[dict]:
    sites = await Site.find(Site.operator_id == operator.id).to_list()
    site_ids = [s.id for s in sites]
    if not site_ids:
        return []
    slots = await Availability.find({"site_id": {"$in": site_ids}}).to_list()
    return [
        {
            "site_id": str(s.site_id),
            "date": str(s.date),
            "slots_remaining": s.slots_remaining,
            "slots_total": s.slots_total,
            "is_blocked": s.is_blocked,
        }
        for s in slots
    ]


@router.get("/{site_id}")
async def get_availability(
    site_id: PydanticObjectId,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[dict]:
    query = Availability.find(Availability.site_id == site_id)
    if from_date:
        query = query.find(Availability.date >= from_date)
    if to_date:
        query = query.find(Availability.date <= to_date)
    slots = await query.to_list()
    return [
        {
            "date": str(s.date),
            "slots_remaining": s.slots_remaining,
            "slots_total": s.slots_total,
            "is_blocked": s.is_blocked,
        }
        for s in slots
    ]


@router.put("/{site_id}")
async def set_availability(
    site_id: PydanticObjectId,
    body: AvailabilitySet,
    operator: User = Depends(require_operator),
) -> dict:
    site = await Site.get(site_id)
    if not site or site.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not your site")

    avail = await Availability.find_one(
        Availability.site_id == site_id, Availability.date == body.date
    )
    if avail:
        await avail.set(
            {
                "slots_total": body.slots_total,
                "slots_remaining": body.slots_total,
                "is_blocked": body.is_blocked,
            }
        )
    else:
        avail = Availability(
            site_id=site_id,
            date=body.date,
            slots_total=body.slots_total,
            slots_remaining=body.slots_total,
            is_blocked=body.is_blocked,
        )
        await avail.insert()

    return {"date": str(body.date), "slots_total": body.slots_total, "is_blocked": body.is_blocked}
