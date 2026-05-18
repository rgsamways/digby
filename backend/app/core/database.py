from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.models.availability import Availability
from app.models.booking import Booking
from app.models.review import Review
from app.models.site import Site
from app.models.user import User

_client: AsyncIOMotorClient | None = None


async def init_db() -> None:
    global _client
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=_client.get_default_database(),
        document_models=[User, Site, Booking, Availability, Review],
    )


async def close_db() -> None:
    if _client:
        _client.close()
