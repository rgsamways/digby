from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

CREDENTIAL_TYPES = [
    "P.Geo", "P.Eng", "MSc/PhD", "OGS/GSC Staff", "University Faculty",
    "GIS Professional", "Other Geoscience Professional",
]

TIER_ORDER = {"ogs_endorsed": 0, "community_reviewer": 1, "verified_expert": 2}


def _public_profile(u: User) -> dict:
    return {
        "id": str(u.id),
        "name": u.name,
        "bio": u.bio,
        "avatar_url": u.avatar_url,
        "expert_tier": u.expert_tier,
        "credential_type": u.credential_type,
        "expert_specialisations": u.expert_specialisations,
        "institutional_affiliation": u.institutional_affiliation,
        "publications_url": u.publications_url,
        "years_experience": u.years_experience,
        "guide_location": u.guide_location,
        "expert_review_count": u.expert_review_count,
        "expert_agreement_rate": u.expert_agreement_rate,
        # credential_reference intentionally omitted — private
    }


@router.get("/")
async def list_experts() -> list[dict]:
    experts = await User.find(
        {"expert_tier": {"$in": ["verified_expert", "community_reviewer", "ogs_endorsed"]}}
    ).to_list()
    experts.sort(key=lambda u: TIER_ORDER.get(u.expert_tier or "", 9))
    return [_public_profile(u) for u in experts]


@router.get("/pending-count")
async def pending_count(_: User = Depends(get_current_user)) -> dict:
    n = await User.find(
        {"credential_type": {"$ne": None}, "expert_tier": None}
    ).count()
    return {"count": n}


@router.get("/{user_id}")
async def get_expert(user_id: str) -> dict:
    from beanie import PydanticObjectId
    try:
        u = await User.get(PydanticObjectId(user_id))
    except Exception:
        raise HTTPException(404, "Expert not found")
    if not u or not u.expert_tier:
        raise HTTPException(404, "Expert not found")
    return _public_profile(u)


class ApplyRequest(BaseModel):
    credential_type: str
    credential_reference: str = ""
    expert_specialisations: list[str] = []
    institutional_affiliation: str = ""
    publications_url: str = ""
    years_experience: int = 0


@router.post("/apply")
async def apply(body: ApplyRequest, user: User = Depends(get_current_user)) -> dict:
    if body.credential_type not in CREDENTIAL_TYPES:
        raise HTTPException(400, f"Invalid credential type. Valid: {CREDENTIAL_TYPES}")
    if user.expert_tier:
        raise HTTPException(400, "You already have an expert tier")

    await user.set({
        "credential_type": body.credential_type,
        "credential_reference": body.credential_reference or None,
        "expert_specialisations": body.expert_specialisations,
        "institutional_affiliation": body.institutional_affiliation or None,
        "publications_url": body.publications_url or None,
        "years_experience": body.years_experience,
    })
    return {"ok": True, "message": "Application submitted for review"}


class ProfileUpdate(BaseModel):
    expert_specialisations: list[str] | None = None
    institutional_affiliation: str | None = None
    publications_url: str | None = None
    years_experience: int | None = None
    bio: str | None = None


@router.patch("/profile")
async def update_profile(
    body: ProfileUpdate, user: User = Depends(get_current_user)
) -> dict:
    if not user.expert_tier:
        raise HTTPException(403, "Expert tier required")
    update: dict = {}
    if body.expert_specialisations is not None:
        update["expert_specialisations"] = body.expert_specialisations
    if body.institutional_affiliation is not None:
        update["institutional_affiliation"] = body.institutional_affiliation
    if body.publications_url is not None:
        update["publications_url"] = body.publications_url
    if body.years_experience is not None:
        update["years_experience"] = body.years_experience
    if body.bio is not None:
        update["bio"] = body.bio
    if update:
        await user.set(update)
    return _public_profile(await User.get(user.id))  # type: ignore[arg-type]
