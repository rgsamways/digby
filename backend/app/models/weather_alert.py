from datetime import UTC, date, datetime

from beanie import Document, PydanticObjectId


class WeatherAlert(Document):
    site_id: PydanticObjectId
    operator_id: PydanticObjectId
    message: str
    affected_dates: list[date] = []
    is_active: bool = True
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "weather_alerts"
        indexes = ["site_id", "operator_id", "is_active"]
