from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document, PydanticObjectId


class GuideBookingStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class GuideBooking(Document):
    guide_id: PydanticObjectId
    visitor_id: PydanticObjectId
    date: datetime
    party_size: int = 1
    location_description: str = ""   # Crown land, meeting point, etc.
    total_amount: float
    platform_fee: float
    guide_payout: float
    status: GuideBookingStatus = GuideBookingStatus.PENDING
    stripe_payment_intent_id: str | None = None
    notes: str = ""
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "guide_bookings"
        indexes = ["guide_id", "visitor_id", "status"]
