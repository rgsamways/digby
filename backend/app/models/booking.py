from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document, PydanticObjectId


class BookingStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Booking(Document):
    site_id: PydanticObjectId
    visitor_id: PydanticObjectId
    operator_id: PydanticObjectId
    date: datetime
    party_size: int
    total_amount: float          # CAD cents -> float dollars
    platform_fee: float
    operator_payout: float
    status: BookingStatus = BookingStatus.PENDING
    stripe_payment_intent_id: str | None = None
    notes: str = ""
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "bookings"
        indexes = ["visitor_id", "operator_id", "site_id", "status"]
