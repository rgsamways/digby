from datetime import UTC, datetime

from beanie import Document
from bson import ObjectId
from pydantic import BaseModel, Field
from pymongo import ASCENDING, IndexModel


class DropPiece(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    mineral_name: str
    formation: str | None = None
    photo_url: str | None = None
    price_cad: float
    description: str | None = None
    status: str = "available"   # available | reserved | sold
    buyer_city: str | None = None
    stripe_payment_intent_id: str | None = None


class SpecimenDrop(Document):
    slug: str
    title: str
    subtitle: str | None = None
    description: str | None = None
    opens_at: datetime
    closes_at: datetime
    pieces: list[DropPiece] = []
    notification_emails: list[str] = []
    is_published: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "specimen_drops"
        indexes = [IndexModel([("slug", ASCENDING)], unique=True)]
