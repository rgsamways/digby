from datetime import datetime
from enum import StrEnum

from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel


class AgeRange(StrEnum):
    YOUNG = "6-8"
    MIDDLE = "8-10"
    OLDER = "10-12"


class RarityTier(StrEnum):
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    LEGENDARY = "legendary"


class BadgeCategory(StrEnum):
    FIELD = "field"
    KNOWLEDGE = "knowledge"
    ENGAGEMENT = "engagement"


class UnlockSource(StrEnum):
    DAILY = "daily"
    FIND_LOG = "find_log"
    BADGE = "badge"
    SITE_VISIT = "site_visit"
    STREAK = "streak"
    GAME = "game"
    BOOKING = "booking"


class DetectiveDifficulty(StrEnum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class JuniorProfile(Document):
    parent_id: Indexed(str)
    first_name: str
    age_range: AgeRange = AgeRange.MIDDLE
    avatar: str = "🪨"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_daily_claim: datetime | None = None
    login_streak: int = 0
    last_login: datetime | None = None
    lessons_completed: list[str] = Field(default_factory=list)  # "track:lesson-slug"

    class Settings:
        name = "junior_profiles"
        indexes = [IndexModel([("parent_id", 1)])]


class JuniorMineral(Document):
    mineral_id: str  # unique slug e.g. "quartz"
    name: str
    family: str
    rarity: RarityTier
    mohs_hardness: float
    key_property: str
    ontario_locality: str
    flavour_text: str
    fun_fact: str
    age_easy_description: str
    age_standard_description: str
    detective_clues: list[str]
    dig_site_associations: list[str] = Field(default_factory=list)
    province_associations: list[str] = Field(default_factory=list)
    card_emoji: str = "💎"
    card_colour: str = "#e2e8f0"

    class Settings:
        name = "junior_minerals"
        indexes = [IndexModel([("mineral_id", 1)], unique=True)]


class JuniorCollection(Document):
    user_id: Indexed(str)
    junior_id: Indexed(str)
    mineral_id: str
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)
    source: UnlockSource

    class Settings:
        name = "junior_collection"
        indexes = [
            IndexModel([("user_id", 1), ("junior_id", 1)]),
            IndexModel([("user_id", 1), ("junior_id", 1), ("mineral_id", 1)], unique=True),
        ]


class Badge(Document):
    badge_id: str
    name: str
    category: BadgeCategory
    description: str
    icon: str
    requirement: str
    card_reward: str | None = None  # mineral_id

    class Settings:
        name = "badges"
        indexes = [IndexModel([("badge_id", 1)], unique=True)]


class BadgeState(Document):
    user_id: Indexed(str)
    junior_id: Indexed(str)
    badge_id: str
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    trigger_event: str

    class Settings:
        name = "badge_states"
        indexes = [
            IndexModel([("user_id", 1), ("junior_id", 1)]),
            IndexModel([("user_id", 1), ("junior_id", 1), ("badge_id", 1)], unique=True),
        ]


class DetectiveCase(Document):
    case_id: str
    title: str
    region: str
    difficulty: DetectiveDifficulty
    scene: str
    clues: list[str]
    options: list[str]  # 4 mineral names
    correct_id: str  # mineral_id
    explanation: str
    unlock_day: int  # cases unlock every 3 days; day 0 = always available
    card_reward_rare: str
    card_reward_uncommon: str
    card_reward_common: str

    class Settings:
        name = "detective_cases"
        indexes = [IndexModel([("case_id", 1)], unique=True)]


class DetectiveCaseHistory(Document):
    user_id: Indexed(str)
    junior_id: Indexed(str)
    case_id: str
    attempts: int = 0
    solved: bool = False
    completed_at: datetime | None = None

    class Settings:
        name = "detective_case_history"
        indexes = [
            IndexModel([("user_id", 1), ("junior_id", 1), ("case_id", 1)], unique=True),
        ]
