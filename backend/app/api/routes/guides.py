from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user, require_guide
from app.models.user import User, UserRole

router = APIRouter()


class GuideProfileUpdate(BaseModel):
    bio: str | None = None
    specialties: list[str] | None = None
    years_experience: int | None = None
    certifications: list[str] | None = None
    rate_per_day: float | None = None
    guide_location: str | None = None
    phone: str | None = None
    avatar_url: str | None = None


@router.get("/")
async def list_guides() -> list[dict]:
    guides = await User.find(
        User.role == UserRole.GUIDE,
        User.is_active == True,
    ).to_list()
    return [_guide_dict(g) for g in guides]


@router.get("/{guide_id}")
async def get_guide(guide_id: str) -> dict:
    guide = await User.get(PydanticObjectId(guide_id))
    if not guide or guide.role != UserRole.GUIDE or not guide.is_active:
        raise HTTPException(status_code=404, detail="Guide not found")
    return _guide_dict(guide)


@router.patch("/me")
async def update_guide_profile(
    body: GuideProfileUpdate,
    guide: User = Depends(require_guide),
) -> dict:
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await guide.set(updates)
    return _guide_dict(guide)


def _guide_dict(g: User) -> dict:
    return {
        "id": str(g.id),
        "name": g.name,
        "bio": g.bio,
        "avatar_url": g.avatar_url,
        "specialties": g.specialties,
        "years_experience": g.years_experience,
        "certifications": g.certifications,
        "rate_per_day": g.rate_per_day,
        "guide_location": g.guide_location,
    }
