from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document
from pydantic import BaseModel


class ShopOrderStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FULFILLED = "fulfilled"
    SHIPPED = "shipped"
    CANCELLED = "cancelled"


class ShopOrderItem(BaseModel):
    product_id: str
    product_name: str
    qty: int
    price: int  # cents at time of purchase


class ShopOrder(Document):
    user_id: str
    items: list[ShopOrderItem]
    total: int  # cents
    status: ShopOrderStatus = ShopOrderStatus.PENDING
    stripe_payment_intent_id: str = ""
    shipping_address: dict = {}
    tracking_number: str = ""
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "shop_orders"
        indexes = ["user_id", "stripe_payment_intent_id"]
