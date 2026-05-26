from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/")
async def list_creators() -> list[dict]:
    creators = await User.find(User.is_creator == True).to_list()  # noqa: E712
    tier_order = {"resident_geologist": 0, "field_geologist": 1, "explorer": 2, None: 3}
    creators.sort(key=lambda u: tier_order.get(u.creator_tier, 3))
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "bio": u.bio,
            "avatar_url": u.avatar_url,
            "creator_tier": u.creator_tier,
            "specialties": u.specialties,
            "guide_location": u.guide_location,
            "social_instagram": u.social_instagram,
            "social_tiktok": u.social_tiktok,
            "social_youtube": u.social_youtube,
            "content_url": u.content_url,
        }
        for u in creators
    ]


class CreatorApplicationIn(BaseModel):
    handle: str
    platform: str   # instagram | tiktok | youtube | other
    short_answer: str
    content_url: str | None = None


@router.post("/apply")
async def apply_for_creator(
    body: CreatorApplicationIn,
    current_user: User = Depends(get_current_user),
) -> dict:
    if current_user.is_creator:
        raise HTTPException(400, "Already a creator")
    if current_user.creator_application_submitted:
        raise HTTPException(400, "Application already submitted")

    valid_platforms = {"instagram", "tiktok", "youtube", "other"}
    if body.platform not in valid_platforms:
        raise HTTPException(400, "Invalid platform")

    await current_user.set({
        "creator_application_submitted": True,
        "creator_application_handle": body.handle.strip().lstrip("@"),
        "creator_application_platform": body.platform,
        "creator_application_short_answer": body.short_answer.strip(),
        "creator_application_at": datetime.now(UTC),
        "content_url": body.content_url or current_user.content_url,
    })
    return {"ok": True}
