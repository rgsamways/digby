from datetime import UTC, datetime

from beanie import Document, PydanticObjectId


class Specimen(Document):
    operator_id: PydanticObjectId
    site_id: PydanticObjectId | None = None
    title: str
    description: str = ""
    minerals: list[str] = []
    province: str = "Ontario"
    price: float
    images: list[str] = []
    quantity: int = 1
    available: int = 1
    is_active: bool = True
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "specimens"
        indexes = ["operator_id", "is_active", "minerals"]
