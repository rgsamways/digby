from datetime import UTC, date, datetime

from beanie import Document, PydanticObjectId


class YieldReport(Document):
    site_id: PydanticObjectId
    operator_id: PydanticObjectId
    session_date: date
    minerals_found: list[str] = []   # e.g. ["amethyst", "calcite"]
    quantity_notes: str = ""         # e.g. "3 large amethyst specimens"
    notes: str = ""
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "yield_reports"
        indexes = ["site_id", "operator_id"]
