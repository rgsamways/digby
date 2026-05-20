from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field


class HuntProgress(Document):
    hunt_id: PydanticObjectId
    booking_id: PydanticObjectId
    visitor_id: PydanticObjectId
    site_id: PydanticObjectId
    found_item_ids: list[str] = []
    completed_at: datetime | None = None
    stamp_awarded: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "hunt_progress"
        indexes = ["hunt_id", "booking_id", "visitor_id"]
