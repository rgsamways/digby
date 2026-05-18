from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field


class Review(Document):
    booking_id: PydanticObjectId
    site_id: PydanticObjectId
    visitor_id: PydanticObjectId
    rating: int = Field(..., ge=1, le=5)
    body: str
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "reviews"
        indexes = ["site_id", "visitor_id"]
