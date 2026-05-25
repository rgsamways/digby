from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.models.alert_subscription import AlertSubscription
from app.models.availability import Availability
from app.models.booking import Booking
from app.models.club import Club, ClubMembership
from app.models.diary_entry import DiaryEntry
from app.models.field_guide import FieldGuide
from app.models.find import Find, FindSave
from app.models.find_verification import FindVerification
from app.models.guide_booking import GuideBooking
from app.models.guide_review import GuideReview
from app.models.hunt_progress import HuntProgress
from app.models.junior import (
    Badge,
    BadgeState,
    DetectiveCase,
    DetectiveCaseHistory,
    JuniorCollection,
    JuniorMineral,
    JuniorProfile,
)
from app.models.partner_business import PartnerBusiness
from app.models.passport_stamp import PassportStamp
from app.models.product import Product
from app.models.quiz_result import QuizResult
from app.models.review import Review
from app.models.scavenger_hunt import ScavengerHunt
from app.models.shop_order import ShopOrder
from app.models.site import Site
from app.models.site_question import SiteQuestion
from app.models.specimen import Specimen
from app.models.specimen_drop import SpecimenDrop
from app.models.specimen_order import SpecimenOrder
from app.models.strata import CollectorCardCode, StrataBox, StrataFulfilment, StrataSubscription
from app.models.user import User
from app.models.waitlist_entry import WaitlistEntry
from app.models.weather_alert import WeatherAlert
from app.models.yield_report import YieldReport

_client: AsyncIOMotorClient | None = None


async def init_db() -> None:
    global _client
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=_client.get_default_database(),
        document_models=[
            User, Site, Booking, Availability, Review, GuideBooking,
            PassportStamp, WeatherAlert, YieldReport, ScavengerHunt,
            HuntProgress, QuizResult, DiaryEntry, PartnerBusiness,
            GuideReview, AlertSubscription, Specimen, SpecimenOrder,
            SiteQuestion, FieldGuide, WaitlistEntry, Product, ShopOrder,
            StrataSubscription, StrataBox, CollectorCardCode, StrataFulfilment,
            SpecimenDrop,
            Find, FindSave, FindVerification,
            JuniorProfile, JuniorMineral, JuniorCollection,
            Badge, BadgeState, DetectiveCase, DetectiveCaseHistory,
            Club, ClubMembership,
        ],
    )


async def close_db() -> None:
    if _client:
        _client.close()
