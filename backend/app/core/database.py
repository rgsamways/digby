from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.models.availability import Availability
from app.models.booking import Booking
from app.models.guide_booking import GuideBooking
from app.models.hunt_progress import HuntProgress
from app.models.passport_stamp import PassportStamp
from app.models.review import Review
from app.models.scavenger_hunt import ScavengerHunt
from app.models.site import Site
from app.models.user import User
from app.models.weather_alert import WeatherAlert
from app.models.yield_report import YieldReport

_client: AsyncIOMotorClient | None = None


async def init_db() -> None:
    global _client
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=_client.get_default_database(),
        document_models=[User, Site, Booking, Availability, Review, GuideBooking, PassportStamp, WeatherAlert, YieldReport, ScavengerHunt, HuntProgress],
    )


async def close_db() -> None:
    if _client:
        _client.close()
