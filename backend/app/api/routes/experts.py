from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.find import Find, VerificationStatus
from app.models.find_verification import FindVerification
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


# ── Verification queue ────────────────────────────────────────────────────────

REVIEWER_TIERS = {"community_reviewer", "verified_expert", "ogs_endorsed"}
VALID_ACTIONS = {
    "confirm", "correct", "confirm_with_note",
    "request_photos", "unidentifiable", "escalate",
}


def _requires_reviewer(user: User) -> User:
    if user.expert_tier not in REVIEWER_TIERS:
        raise HTTPException(403, "Expert reviewer tier required")
    return user


def _find_dict(f: Find, review_count: int = 0) -> dict:
    return {
        "id": str(f.id),
        "mineral_name": f.mineral_name,
        "photo_urls": f.photo_urls,
        "host_rock": f.host_rock,
        "geological_province": f.geological_province,
        "formation": f.formation,
        "specimen_quality": f.specimen_quality,
        "uv_fluorescence": f.uv_fluorescence,
        "notes": f.notes,
        "verification_status": f.verification_status,
        "citizen_science_opted_in": f.citizen_science_opted_in,
        "created_at": f.created_at.isoformat(),
        "review_count": review_count,
    }


@router.get("/verification/queue")
async def verification_queue(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str = Query("ai_likely", description="ai_likely | disputed | all"),
    user: User = Depends(get_current_user),
) -> dict:
    _requires_reviewer(user)

    if status_filter == "all":
        query = {
            "verification_status": {
                "$in": [VerificationStatus.AI_LIKELY, VerificationStatus.DISPUTED],
            },
            "photo_urls.0": {"$exists": True},
        }
    elif status_filter == "disputed":
        query = {
            "verification_status": VerificationStatus.DISPUTED,
            "photo_urls.0": {"$exists": True},
        }
    else:
        query = {
            "verification_status": VerificationStatus.AI_LIKELY,
            "photo_urls.0": {"$exists": True},
        }

    total = await Find.find(query).count()
    finds = await Find.find(query).skip(skip).limit(limit).to_list()

    results = []
    for f in finds:
        rc = await FindVerification.find({"find_id": str(f.id)}).count()
        results.append(_find_dict(f, rc))

    return {"total": total, "items": results}


@router.get("/verification/my-stats")
async def my_verification_stats(user: User = Depends(get_current_user)) -> dict:
    _requires_reviewer(user)
    return {
        "review_count": user.expert_review_count,
        "agreement_rate": user.expert_agreement_rate,
        "tier": user.expert_tier,
    }


@router.get("/verification/{find_id}/reviews")
async def get_find_reviews(find_id: str, user: User = Depends(get_current_user)) -> list[dict]:
    _requires_reviewer(user)
    reviews = await FindVerification.find({"find_id": find_id}).to_list()
    return [
        {
            "id": str(r.id),
            "reviewer_name": r.reviewer_name,
            "reviewer_tier": r.reviewer_tier,
            "action": r.action,
            "corrected_mineral": r.corrected_mineral,
            "note": r.note,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]


class ReviewRequest(BaseModel):
    action: str
    corrected_mineral: str | None = None
    note: str | None = None


@router.post("/verification/{find_id}")
async def submit_review(
    find_id: str,
    body: ReviewRequest,
    user: User = Depends(get_current_user),
) -> dict:
    _requires_reviewer(user)

    if body.action not in VALID_ACTIONS:
        raise HTTPException(400, f"Invalid action. Valid: {sorted(VALID_ACTIONS)}")
    if body.action == "correct" and not body.corrected_mineral:
        raise HTTPException(400, "corrected_mineral required for 'correct' action")

    from beanie import PydanticObjectId
    try:
        f = await Find.get(PydanticObjectId(find_id))
    except Exception:
        raise HTTPException(404, "Find not found")
    if not f:
        raise HTTPException(404, "Find not found")

    # Prevent duplicate reviews from the same reviewer
    existing = await FindVerification.find_one({"find_id": find_id, "reviewer_id": str(user.id)})
    if existing:
        raise HTTPException(409, "You have already reviewed this find")

    review = FindVerification(
        find_id=find_id,
        reviewer_id=str(user.id),
        reviewer_name=user.name,
        reviewer_tier=user.expert_tier or "",
        action=body.action,
        corrected_mineral=body.corrected_mineral,
        note=body.note,
    )
    await review.insert()

    # Update verification status based on action + reviewer tier
    new_status = f.verification_status
    if body.action in ("confirm", "correct", "confirm_with_note"):
        if user.expert_tier == "ogs_endorsed":
            new_status = VerificationStatus.OGS_REVIEWED
        else:
            # Promote to community_verified after 2+ confirming reviews
            confirm_count = await FindVerification.find(
                {"find_id": find_id, "action": {"$in": ["confirm", "correct", "confirm_with_note"]}}
            ).count()
            if confirm_count >= 2:
                new_status = VerificationStatus.COMMUNITY_VERIFIED
    elif body.action == "escalate":
        new_status = VerificationStatus.DISPUTED

    if new_status != f.verification_status:
        await f.set({"verification_status": new_status})

    # Update reviewer stats
    new_count = user.expert_review_count + 1
    await user.set({"expert_review_count": new_count})

    return {"ok": True, "new_status": new_status}
