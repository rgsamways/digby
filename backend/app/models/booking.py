from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document, PydanticObjectId
from pydantic import BaseModel


class BookingStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class GroupMember(BaseModel):
    name: str
    email: str
    amount_owed: float
    paid: bool = False


class Booking(Document):
    site_id: PydanticObjectId
    visitor_id: PydanticObjectId          # group leader
    operator_id: PydanticObjectId
    date: datetime
    party_size: int
    total_amount: float
    platform_fee: float
    operator_payout: float
    status: BookingStatus = BookingStatus.PENDING
    stripe_payment_intent_id: str | None = None
    notes: str = ""
    # group booking fields
    is_mystery: bool = False
    mystery_province: str = ""
    is_group_booking: bool = False
    group_members: list[GroupMember] = []  # additional members beyond leader
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "bookings"
        indexes = ["visitor_id", "operator_id", "site_id", "status"]
