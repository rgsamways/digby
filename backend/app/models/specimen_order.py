from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document, PydanticObjectId


class OrderStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    CANCELLED = "cancelled"


class SpecimenOrder(Document):
    specimen_id: PydanticObjectId
    buyer_id: PydanticObjectId
    operator_id: PydanticObjectId
    quantity: int = 1
    total_amount: float
    platform_fee: float
    operator_payout: float
    status: OrderStatus = OrderStatus.PENDING
    stripe_payment_intent_id: str | None = None
    shipping_address: str = ""
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "specimen_orders"
        indexes = ["buyer_id", "operator_id", "specimen_id", "status"]
