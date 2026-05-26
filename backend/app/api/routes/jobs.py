from datetime import UTC, datetime, timedelta

import stripe
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user, require_admin_token
from app.core.config import settings
from app.models.job_listing import JobListing, JobStatus
from app.models.user import User

router = APIRouter()

stripe.api_key = settings.STRIPE_SECRET_KEY

LISTING_FEE_CENTS = 7500  # $75 CAD


def _listing_dict(j: JobListing) -> dict:
    return {
        "id": str(j.id),
        "title": j.title,
        "company": j.company,
        "location": j.location,
        "job_type": j.job_type,
        "category": j.category,
        "description": j.description,
        "salary_range": j.salary_range,
        "apply_url": j.apply_url,
        "apply_email": j.apply_email,
        "is_featured": j.is_featured,
        "status": j.status,
        "expires_at": j.expires_at.isoformat() if j.expires_at else None,
        "created_at": j.created_at.isoformat(),
    }


# ── Public endpoints ──────────────────────────────────────────────────────────

@router.get("/")
async def list_jobs() -> list[dict]:
    now = datetime.now(UTC)
    jobs = await JobListing.find(
        JobListing.status == JobStatus.ACTIVE,
        {"$or": [
            {"expires_at": None},
            {"expires_at": {"$gt": now}},
        ]},
    ).sort("-is_featured", "-created_at").to_list()
    return [_listing_dict(j) for j in jobs]


class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    job_type: str
    category: str
    description: str
    salary_range: str | None = None
    apply_url: str | None = None
    apply_email: str | None = None


@router.post("/")
async def create_job_listing(
    body: JobCreate,
    user: User = Depends(get_current_user),
) -> dict:
    listing = JobListing(
        title=body.title,
        company=body.company,
        location=body.location,
        job_type=body.job_type,
        category=body.category,
        description=body.description,
        salary_range=body.salary_range,
        apply_url=body.apply_url,
        apply_email=body.apply_email,
        posted_by_email=user.email,
    )
    await listing.insert()

    intent = stripe.PaymentIntent.create(
        amount=LISTING_FEE_CENTS,
        currency="cad",
        receipt_email=user.email,
        metadata={
            "order_type": "job_listing",
            "job_id": str(listing.id),
        },
    )
    await listing.set({"stripe_payment_intent_id": intent.id})

    return {
        "listing_id": str(listing.id),
        "client_secret": intent.client_secret,
    }


@router.get("/{listing_id}")
async def get_job_listing(listing_id: str) -> dict:
    try:
        listing = await JobListing.get(PydanticObjectId(listing_id))
    except Exception:
        raise HTTPException(404, "Not found")
    if not listing:
        raise HTTPException(404, "Not found")
    return _listing_dict(listing)


# ── Webhook helper (called from payments.py) ─────────────────────────────────

async def activate_job_listing(pi: dict) -> None:
    job_id = pi.get("metadata", {}).get("job_id", "")
    if not job_id:
        return
    try:
        listing = await JobListing.get(PydanticObjectId(job_id))
    except Exception:
        return
    if listing and listing.status == JobStatus.PENDING:
        await listing.set({
            "status": JobStatus.ACTIVE,
            "expires_at": datetime.now(UTC) + timedelta(days=30),
        })


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin/all")
async def admin_list_jobs(
    _: None = Depends(require_admin_token),
) -> list[dict]:
    jobs = await JobListing.find_all().sort("-created_at").to_list()
    return [
        {
            **_listing_dict(j),
            "posted_by_email": j.posted_by_email,
            "stripe_payment_intent_id": j.stripe_payment_intent_id,
            "listing_fee": j.listing_fee,
        }
        for j in jobs
    ]


class JobAdminUpdate(BaseModel):
    status: str | None = None
    is_featured: bool | None = None


@router.patch("/admin/{listing_id}")
async def admin_update_job(
    listing_id: str,
    body: JobAdminUpdate,
    _: None = Depends(require_admin_token),
) -> dict:
    try:
        listing = await JobListing.get(PydanticObjectId(listing_id))
    except Exception:
        raise HTTPException(404, "Not found")
    if not listing:
        raise HTTPException(404, "Not found")

    updates: dict = {}
    if body.status is not None:
        valid = {s.value for s in JobStatus}
        if body.status not in valid:
            raise HTTPException(400, f"Invalid status: {body.status}")
        updates["status"] = body.status
        if body.status == JobStatus.ACTIVE and not listing.expires_at:
            updates["expires_at"] = datetime.now(UTC) + timedelta(days=30)
    if body.is_featured is not None:
        updates["is_featured"] = body.is_featured

    if updates:
        await listing.set(updates)

    return {"ok": True}
