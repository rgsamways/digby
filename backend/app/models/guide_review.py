from datetime import UTC, datetime

from beanie import Document


class GuideReview(Document):
    guide_id: str
    visitor_id: str
    guide_booking_id: str
    rating: int                  # 1–5
    body: str = ""
    visitor_name: str = ""
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "guide_reviews"
        indexes = ["guide_id", "visitor_id", "guide_booking_id"]
