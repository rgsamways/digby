from datetime import UTC, datetime
from enum import StrEnum
from typing import Annotated

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field


class SiteType(StrEnum):
    PAY_TO_DIG = "pay-to-dig"
    GUIDED_TOUR = "guided-tour"
    COLLECTING_WALK = "collecting-walk"


class GeoPoint(BaseModel):
    type: str = "Point"
    coordinates: list[float] = Field(..., description="[longitude, latitude]")


class Site(Document):
    operator_id: PydanticObjectId
    name: Annotated[str, Indexed()]
    description: str
    location: GeoPoint
    address: str
    province: str = "Ontario"
    minerals: list[str] = []
    price_per_person: float
    max_group_size: int = 10
    duration_hours: float = 3.0
    site_type: SiteType = SiteType.PAY_TO_DIG
    images: list[str] = []
    rules: str = ""
    is_active: bool = True
    rating: float = 0.0
    review_count: int = 0
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "sites"
        indexes = [
            [("location", "2dsphere")],
            "operator_id",
            "is_active",
        ]
