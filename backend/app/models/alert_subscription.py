from datetime import UTC, datetime

from beanie import Document


class AlertSubscription(Document):
    visitor_id: str
    email: str
    minerals: list[str] = []    # empty = all minerals
    provinces: list[str] = []   # empty = all provinces
    is_active: bool = True
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "alert_subscriptions"
        indexes = ["visitor_id", "is_active"]
