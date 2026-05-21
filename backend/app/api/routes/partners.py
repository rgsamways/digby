from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.partner_business import PartnerBusiness
from app.models.user import User, UserRole

router = APIRouter()


class PartnerCreate(BaseModel):
    name: str
    tagline: str = ""
    url: str = ""
    perk: str = ""
    region: str
    categories: list[str] = []


def _partner_dict(p: PartnerBusiness) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "tagline": p.tagline,
        "url": p.url,
        "perk": p.perk,
        "region": p.region,
        "categories": p.categories,
    }


@router.get("/near")
async def partners_near(region: str) -> list[dict]:
    """Return active partners whose region appears in the given region string (case-insensitive)."""
    all_partners = await PartnerBusiness.find(PartnerBusiness.is_active == True).to_list()  # noqa: E712
    region_lower = region.lower()
    matched = [
        p for p in all_partners
        if p.region.lower() in region_lower or region_lower in p.region.lower()
    ]
    return [_partner_dict(p) for p in matched]


@router.post("/")
async def create_partner(
    body: PartnerCreate,
    user: User = Depends(get_current_user),
) -> dict:
    if user.role not in (UserRole.ADMIN, UserRole.OPERATOR):
        raise HTTPException(status_code=403, detail="Admin only")
    partner = PartnerBusiness(**body.model_dump())
    await partner.insert()
    return _partner_dict(partner)


@router.delete("/{partner_id}")
async def delete_partner(
    partner_id: str,
    user: User = Depends(get_current_user),
) -> dict:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    from beanie import PydanticObjectId
    partner = await PartnerBusiness.get(PydanticObjectId(partner_id))
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    await partner.delete()
    return {"deleted": True}
