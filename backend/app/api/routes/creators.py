from fastapi import APIRouter

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
