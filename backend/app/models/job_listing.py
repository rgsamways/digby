from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document


class JobStatus(StrEnum):
    PENDING = "pending"     # awaiting payment
    ACTIVE = "active"       # paid and live
    EXPIRED = "expired"     # past 30-day window
    REJECTED = "rejected"   # admin rejected


class JobListing(Document):
    title: str
    company: str
    location: str
    job_type: str       # full-time | part-time | contract | seasonal | volunteer
    category: str       # field-technician | geologist | lab | prospecting | mining-ops | environmental | education | consulting | other
    description: str
    salary_range: str | None = None
    apply_url: str | None = None
    apply_email: str | None = None
    posted_by_email: str
    status: JobStatus = JobStatus.PENDING
    stripe_payment_intent_id: str | None = None
    listing_fee: float = 75.0   # CAD
    is_featured: bool = False
    expires_at: datetime | None = None
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "job_listings"
        indexes = ["status", "created_at"]
