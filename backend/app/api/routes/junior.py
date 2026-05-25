import random
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.junior import (
    AgeRange,
    Badge,
    BadgeState,
    DetectiveCase,
    DetectiveCaseHistory,
    JuniorCollection,
    JuniorMineral,
    JuniorProfile,
    RarityTier,
    UnlockSource,
)
from app.models.user import User

router = APIRouter()

RARITY_WEIGHTS = {
    RarityTier.COMMON: 60,
    RarityTier.UNCOMMON: 25,
    RarityTier.RARE: 13,
    RarityTier.LEGENDARY: 2,
}


# ── Schemas ──────────────────────────────────────────────────────────────────

class ProfileCreate(BaseModel):
    first_name: str
    age_range: AgeRange = AgeRange.MIDDLE
    avatar: str = "🪨"


class ProfileUpdate(BaseModel):
    first_name: str | None = None
    age_range: AgeRange | None = None
    avatar: str | None = None


class DetectiveSubmit(BaseModel):
    answer_id: str  # mineral_id chosen by child


class DigCompleteBody(BaseModel):
    mineral_names: list[str]  # names of minerals found (from dig game)


class LessonCompleteBody(BaseModel):
    track: str   # e.g. "field", "gis"
    lesson: str  # lesson slug


# ── Helpers ──────────────────────────────────────────────────────────────────

def _ensure_mine(junior: JuniorProfile, user: User) -> None:
    if junior.parent_id != str(user.id):
        raise HTTPException(status_code=403, detail="Not your junior profile")


async def _unlock_card(
    user_id: str, junior_id: str, mineral_id: str, source: UnlockSource
) -> JuniorCollection | None:
    existing = await JuniorCollection.find_one(
        JuniorCollection.user_id == user_id,
        JuniorCollection.junior_id == junior_id,
        JuniorCollection.mineral_id == mineral_id,
    )
    if existing:
        return None
    entry = JuniorCollection(
        user_id=user_id, junior_id=junior_id,
        mineral_id=mineral_id, source=source,
    )
    await entry.insert()
    return entry


async def _evaluate_badges(
    user_id: str, junior_id: str, trigger: str, context: dict | None = None
) -> list[str]:
    """Grant any newly-earned badges and return their IDs."""
    ctx = context or {}
    all_badges = await Badge.find().to_list()
    earned = await BadgeState.find(
        BadgeState.user_id == user_id,
        BadgeState.junior_id == junior_id,
    ).to_list()
    earned_ids = {b.badge_id for b in earned}

    collection = await JuniorCollection.find(
        JuniorCollection.user_id == user_id,
        JuniorCollection.junior_id == junior_id,
    ).to_list()

    all_minerals = await JuniorMineral.find().to_list()
    collected_ids = {c.mineral_id for c in collection}

    detective_solved = await DetectiveCaseHistory.find(
        DetectiveCaseHistory.user_id == user_id,
        DetectiveCaseHistory.junior_id == junior_id,
        DetectiveCaseHistory.solved == True,  # noqa: E712
    ).to_list()

    junior = await JuniorProfile.get(junior_id)
    new_badges: list[str] = []

    for badge in all_badges:
        if badge.badge_id in earned_ids:
            continue

        earned_flag = False
        bid = badge.badge_id

        # ── Collection size badges ──────────────────────────────────────────
        if bid == "first-find":
            earned_flag = len(collection) >= 1
        elif bid == "hat-trick":
            earned_flag = len(collection) >= 3
        elif bid == "master-collector":
            earned_flag = len(collection) >= 10
        elif bid == "complete-collection":
            all_ids = {m.mineral_id for m in all_minerals}
            earned_flag = bool(all_minerals) and all_ids == collected_ids

        # ── Province / field badges (from context) ─────────────────────────
        elif bid == "province-pioneer":
            earned_flag = ctx.get("province_count", 0) >= 2
        elif bid == "full-shield":
            earned_flag = ctx.get("province_count", 0) >= 4
        elif bid == "photo-geologist":
            earned_flag = ctx.get("has_photo", False)
        elif bid == "citizen-scientist":
            earned_flag = ctx.get("citizen_science_eligible", False)

        # ── Streak badge ────────────────────────────────────────────────────
        elif bid == "seven-day-streak":
            earned_flag = junior is not None and junior.login_streak >= 7

        # ── Detective badges ────────────────────────────────────────────────
        elif bid == "rock-detective-rookie":
            earned_flag = len(detective_solved) >= 1
        elif bid == "rock-detective-case-closed":
            earned_flag = len(detective_solved) >= 5
        elif bid == "rock-detective-master":
            total_cases = await DetectiveCase.find().count()
            earned_flag = total_cases > 0 and len(detective_solved) >= total_cases

        # ── Shop / engagement badges ────────────────────────────────────────
        elif bid == "gear-up":
            earned_flag = ctx.get("shop_order", False)
        elif bid == "season-regular":
            if junior:
                days = (datetime.utcnow() - junior.created_at).days
                earned_flag = days >= 90

        # ── Learn track badges ─────────────────────────────────────────────
        elif bid == "mineral-scholar":
            earned_flag = ctx.get("track_lessons_completed", 0) >= 5

        # ── Province / exploration badges ──────────────────────────────────
        elif bid == "province-explorer":
            earned_flag = ctx.get("province_count", 0) >= 1

        # ── Dig badge ──────────────────────────────────────────────────────
        elif bid == "deep-digger":
            earned_flag = trigger == "dig_complete"

        # ── Booking badges handled by award_booking_badge() directly ───────
        # site-visitor, return-explorer handled there

        if earned_flag:
            state = BadgeState(
                user_id=user_id, junior_id=junior_id,
                badge_id=badge.badge_id, trigger_event=trigger,
            )
            await state.insert()
            new_badges.append(badge.badge_id)
            if badge.card_reward:
                await _unlock_card(user_id, junior_id, badge.card_reward, UnlockSource.BADGE)

    return new_badges


async def award_booking_badge(
    user_id: str, junior_id: str, site_id: str | None = None
) -> list[str]:
    """Called from bookings route when a booking completes."""
    new_badges: list[str] = []

    # site-visitor: first booking ever
    first_booking = await BadgeState.find_one(
        BadgeState.user_id == user_id,
        BadgeState.junior_id == junior_id,
        BadgeState.badge_id == "site-visitor",
    )
    if not first_booking:
        badge = await Badge.find_one(Badge.badge_id == "site-visitor")
        if badge:
            await BadgeState(
                user_id=user_id, junior_id=junior_id,
                badge_id="site-visitor", trigger_event="booking_complete",
            ).insert()
            new_badges.append("site-visitor")
            if badge.card_reward:
                await _unlock_card(user_id, junior_id, badge.card_reward, UnlockSource.BOOKING)

    # return-explorer: bookings at 2+ different sites
    if site_id:
        from beanie import PydanticObjectId

        from app.models.booking import Booking
        try:
            all_bookings = await Booking.find(
                {"visitor_id": PydanticObjectId(user_id), "status": "completed"}
            ).to_list()
            distinct_sites = {str(b.site_id) for b in all_bookings if b.site_id}
            if len(distinct_sites) >= 2:
                return_badge = await BadgeState.find_one(
                    BadgeState.user_id == user_id,
                    BadgeState.junior_id == junior_id,
                    BadgeState.badge_id == "return-explorer",
                )
                if not return_badge:
                    badge2 = await Badge.find_one(Badge.badge_id == "return-explorer")
                    if badge2:
                        await BadgeState(
                            user_id=user_id, junior_id=junior_id,
                            badge_id="return-explorer", trigger_event="booking_complete",
                        ).insert()
                        new_badges.append("return-explorer")
                        if badge2.card_reward:
                            await _unlock_card(
                                user_id, junior_id, badge2.card_reward, UnlockSource.BOOKING
                            )
        except Exception:
            pass

    return new_badges


# ── Profiles ─────────────────────────────────────────────────────────────────

@router.post("/profiles", status_code=201)
async def create_profile(body: ProfileCreate, user: User = Depends(get_current_user)) -> dict:
    existing = await JuniorProfile.find(JuniorProfile.parent_id == str(user.id)).to_list()
    if len(existing) >= 4:
        raise HTTPException(status_code=400, detail="Max 4 junior profiles per account")
    profile = JuniorProfile(
        parent_id=str(user.id),
        first_name=body.first_name,
        age_range=body.age_range,
        avatar=body.avatar,
    )
    await profile.insert()
    return {"id": str(profile.id), **profile.model_dump(exclude={"id", "revision_id"})}


@router.get("/profiles")
async def list_profiles(user: User = Depends(get_current_user)) -> list:
    profiles = await JuniorProfile.find(JuniorProfile.parent_id == str(user.id)).to_list()
    return [{"id": str(p.id), **p.model_dump(exclude={"id", "revision_id"})} for p in profiles]


@router.patch("/profiles/{junior_id}")
async def update_profile(
    junior_id: str, body: ProfileUpdate, user: User = Depends(get_current_user)
) -> dict:
    junior = await JuniorProfile.get(junior_id)
    if not junior:
        raise HTTPException(status_code=404)
    _ensure_mine(junior, user)
    updates = body.model_dump(exclude_none=True)
    if updates:
        await junior.set(updates)
    return {"id": str(junior.id), **junior.model_dump(exclude={"id", "revision_id"})}


@router.delete("/profiles/{junior_id}", status_code=204)
async def delete_profile(junior_id: str, user: User = Depends(get_current_user)) -> None:
    junior = await JuniorProfile.get(junior_id)
    if not junior:
        raise HTTPException(status_code=404)
    _ensure_mine(junior, user)
    await junior.delete()


# ── Minerals ─────────────────────────────────────────────────────────────────

@router.get("/minerals")
async def list_minerals() -> list:
    minerals = await JuniorMineral.find().to_list()
    return [m.model_dump(exclude={"id", "revision_id"}) for m in minerals]


# ── Seed (admin) ──────────────────────────────────────────────────────────────

@router.post("/seed", status_code=201)
async def seed_data() -> dict:
    from app.api.routes.junior_seed import BADGES, DETECTIVE_CASES, MINERALS

    mineral_count = 0
    for data in MINERALS:
        existing = await JuniorMineral.find_one(JuniorMineral.mineral_id == data["mineral_id"])
        if not existing:
            await JuniorMineral(**data).insert()
            mineral_count += 1

    badge_count = 0
    for data in BADGES:
        existing = await Badge.find_one(Badge.badge_id == data["badge_id"])
        if not existing:
            await Badge(**data).insert()
            badge_count += 1

    case_count = 0
    for data in DETECTIVE_CASES:
        existing = await DetectiveCase.find_one(DetectiveCase.case_id == data["case_id"])
        if not existing:
            await DetectiveCase(**data).insert()
            case_count += 1

    return {"minerals_added": mineral_count, "badges_added": badge_count, "cases_added": case_count}


# ── Parent summary ────────────────────────────────────────────────────────────

@router.get("/parent-summary")
async def parent_summary(user: User = Depends(get_current_user)) -> list:
    profiles = await JuniorProfile.find(JuniorProfile.parent_id == str(user.id)).to_list()
    result = []
    for p in profiles:
        uid, jid = str(user.id), str(p.id)
        cards = await JuniorCollection.find(
            JuniorCollection.user_id == uid, JuniorCollection.junior_id == jid,
        ).count()
        badges = await BadgeState.find(
            BadgeState.user_id == uid, BadgeState.junior_id == jid,
        ).count()
        solved = await DetectiveCaseHistory.find(
            DetectiveCaseHistory.user_id == uid,
            DetectiveCaseHistory.junior_id == jid,
            DetectiveCaseHistory.solved == True,  # noqa: E712
        ).count()
        result.append({
            "id": jid,
            "first_name": p.first_name,
            "avatar": p.avatar,
            "age_range": p.age_range,
            "login_streak": p.login_streak,
            "cards_collected": cards,
            "badges_earned": badges,
            "cases_solved": solved,
        })
    return result


# ── Collection ────────────────────────────────────────────────────────────────

@router.get("/{junior_id}/collection")
async def get_collection(junior_id: str, user: User = Depends(get_current_user)) -> list:
    junior = await JuniorProfile.get(junior_id)
    if not junior:
        raise HTTPException(status_code=404)
    _ensure_mine(junior, user)

    collection = await JuniorCollection.find(
        JuniorCollection.user_id == str(user.id),
        JuniorCollection.junior_id == junior_id,
    ).to_list()
    all_minerals = await JuniorMineral.find().to_list()
    collected_map = {c.mineral_id: c for c in collection}

    return [
        {
            "mineral": m.model_dump(exclude={"id", "revision_id"}),
            "owned": m.mineral_id in collected_map,
            "unlocked_at": collected_map[m.mineral_id].unlocked_at.isoformat()
            if m.mineral_id in collected_map else None,
            "source": collected_map[m.mineral_id].source
            if m.mineral_id in collected_map else None,
        }
        for m in all_minerals
    ]


@router.post("/{junior_id}/daily-card")
async def claim_daily_card(junior_id: str, user: User = Depends(get_current_user)) -> dict:
    junior = await JuniorProfile.get(junior_id)
    if not junior:
        raise HTTPException(status_code=404)
    _ensure_mine(junior, user)

    today = date.today()
    if junior.last_daily_claim and junior.last_daily_claim.date() == today:
        raise HTTPException(status_code=400, detail="Daily card already claimed today")

    yesterday = today - timedelta(days=1)
    if junior.last_login and junior.last_login.date() == yesterday:
        new_streak = junior.login_streak + 1
    else:
        new_streak = 1

    all_minerals = await JuniorMineral.find().to_list()
    collection = await JuniorCollection.find(
        JuniorCollection.user_id == str(user.id),
        JuniorCollection.junior_id == junior_id,
    ).to_list()
    collected_ids = {c.mineral_id for c in collection}

    uncollected = [m for m in all_minerals if m.mineral_id not in collected_ids]
    pool = uncollected if uncollected else all_minerals
    weights = [RARITY_WEIGHTS[m.rarity] for m in pool]
    chosen = random.choices(pool, weights=weights, k=1)[0]

    now = datetime.utcnow()
    new_entry = await _unlock_card(str(user.id), junior_id, chosen.mineral_id, UnlockSource.DAILY)
    await junior.set({"last_daily_claim": now, "last_login": now, "login_streak": new_streak})

    new_badges = await _evaluate_badges(str(user.id), junior_id, "daily_claim")

    return {
        "mineral": chosen.model_dump(exclude={"id", "revision_id"}),
        "is_new": new_entry is not None,
        "streak": new_streak,
        "new_badges": new_badges,
    }


# ── Badges ────────────────────────────────────────────────────────────────────

@router.get("/{junior_id}/badges")
async def get_badges(junior_id: str, user: User = Depends(get_current_user)) -> list:
    junior = await JuniorProfile.get(junior_id)
    if not junior:
        raise HTTPException(status_code=404)
    _ensure_mine(junior, user)

    badge_states = await BadgeState.find(
        BadgeState.user_id == str(user.id),
        BadgeState.junior_id == junior_id,
    ).to_list()
    earned_map = {b.badge_id: b.earned_at for b in badge_states}

    all_badges = await Badge.find().to_list()
    return [
        {
            **badge.model_dump(exclude={"id", "revision_id"}),
            "earned": badge.badge_id in earned_map,
            "earned_at": earned_map.get(badge.badge_id),
        }
        for badge in all_badges
    ]


# ── Dig complete ─────────────────────────────────────────────────────────────

@router.post("/{junior_id}/dig-complete")
async def dig_complete(
    junior_id: str, body: DigCompleteBody, user: User = Depends(get_current_user)
) -> dict:
    junior = await JuniorProfile.get(junior_id)
    if not junior:
        raise HTTPException(status_code=404)
    _ensure_mine(junior, user)

    all_minerals = await JuniorMineral.find().to_list()
    name_map = {m.name.lower(): m for m in all_minerals}

    new_cards: list[str] = []
    for name in body.mineral_names:
        mineral = name_map.get(name.lower())
        if mineral:
            entry = await _unlock_card(
                str(user.id), junior_id, mineral.mineral_id, UnlockSource.GAME
            )
            if entry:
                new_cards.append(mineral.mineral_id)

    new_badges = await _evaluate_badges(str(user.id), junior_id, "dig_complete")
    return {"new_cards": new_cards, "new_badges": new_badges}


# ── Lesson complete ───────────────────────────────────────────────────────────

@router.post("/{junior_id}/lesson-complete")
async def lesson_complete(
    junior_id: str, body: LessonCompleteBody, user: User = Depends(get_current_user)
) -> dict:
    junior = await JuniorProfile.get(junior_id)
    if not junior:
        raise HTTPException(status_code=404)
    _ensure_mine(junior, user)

    # Track lesson completions on the profile
    completed_key = f"{body.track}:{body.lesson}"
    lessons_done: list[str] = list(junior.lessons_completed)
    if completed_key not in lessons_done:
        lessons_done.append(completed_key)
        await junior.set({"lessons_completed": lessons_done})

    # Count completed lessons for this track to evaluate mineral-scholar
    track_done = sum(1 for k in lessons_done if k.startswith(f"{body.track}:"))

    new_badges = await _evaluate_badges(
        str(user.id), junior_id, "lesson_complete",
        {
            "lessons_completed": len(lessons_done),
            "track_lessons_completed": track_done,
            "track": body.track,
        },
    )
    return {"new_badges": new_badges, "lessons_completed": lessons_done}


# ── Province unlock ───────────────────────────────────────────────────────────

@router.get("/{junior_id}/provinces")
async def get_provinces(junior_id: str, user: User = Depends(get_current_user)) -> dict:
    """Return explored geological provinces for this junior, derived from parent's find logs."""
    junior = await JuniorProfile.get(junior_id)
    if not junior:
        raise HTTPException(status_code=404)
    _ensure_mine(junior, user)

    from app.models.find import Find
    finds = await Find.find(Find.user_id == user.id).to_list()
    explored = sorted({f.geological_province for f in finds if f.geological_province})

    new_badges = await _evaluate_badges(
        str(user.id), junior_id, "province_view",
        {"province_count": len(explored)},
    )
    return {"explored_provinces": explored, "new_badges": new_badges}


# ── Detective ─────────────────────────────────────────────────────────────────

@router.get("/{junior_id}/detective/cases")
async def list_detective_cases(junior_id: str, user: User = Depends(get_current_user)) -> list:
    junior = await JuniorProfile.get(junior_id)
    if not junior:
        raise HTTPException(status_code=404)
    _ensure_mine(junior, user)

    days_active = (datetime.utcnow() - junior.created_at).days
    all_cases = await DetectiveCase.find().to_list()
    history = await DetectiveCaseHistory.find(
        DetectiveCaseHistory.user_id == str(user.id),
        DetectiveCaseHistory.junior_id == junior_id,
    ).to_list()
    history_map = {h.case_id: h for h in history}

    return [
        {
            **case.model_dump(exclude={"id", "revision_id", "correct_id"}),
            "unlocked": case.unlock_day == 0 or days_active >= case.unlock_day,
            "solved": history_map[case.case_id].solved if case.case_id in history_map else False,
            "attempts": history_map[case.case_id].attempts if case.case_id in history_map else 0,
        }
        for case in all_cases
    ]


@router.post("/{junior_id}/detective/{case_id}/submit")
async def submit_detective_answer(
    junior_id: str,
    case_id: str,
    body: DetectiveSubmit,
    user: User = Depends(get_current_user),
) -> dict:
    junior = await JuniorProfile.get(junior_id)
    if not junior:
        raise HTTPException(status_code=404)
    _ensure_mine(junior, user)

    case = await DetectiveCase.find_one(DetectiveCase.case_id == case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    days_active = (datetime.utcnow() - junior.created_at).days
    if case.unlock_day > 0 and days_active < case.unlock_day:
        raise HTTPException(status_code=403, detail="Case not yet unlocked")

    history = await DetectiveCaseHistory.find_one(
        DetectiveCaseHistory.user_id == str(user.id),
        DetectiveCaseHistory.junior_id == junior_id,
        DetectiveCaseHistory.case_id == case_id,
    )
    if history and history.solved:
        raise HTTPException(status_code=400, detail="Case already solved")

    if not history:
        history = DetectiveCaseHistory(
            user_id=str(user.id), junior_id=junior_id, case_id=case_id,
        )
        await history.insert()

    await history.set({"attempts": history.attempts + 1})
    # Reload to get updated attempts count
    history = await DetectiveCaseHistory.get(history.id)

    # Options are mineral names; correct_id is a mineral slug — look up the name to compare
    correct_mineral = await JuniorMineral.find_one(JuniorMineral.mineral_id == case.correct_id)
    correct_name = correct_mineral.name if correct_mineral else case.correct_id
    correct = body.answer_id == correct_name

    card_reward: str | None = None
    new_badges: list[str] = []

    if correct:
        await history.set({"solved": True, "completed_at": datetime.utcnow()})
        attempts = history.attempts if history else 1
        if attempts == 1:
            card_reward = case.card_reward_rare
        elif attempts == 2:
            card_reward = case.card_reward_uncommon
        else:
            card_reward = case.card_reward_common
        await _unlock_card(str(user.id), junior_id, card_reward, UnlockSource.GAME)
        new_badges = await _evaluate_badges(str(user.id), junior_id, f"detective:{case_id}")

    return {
        "correct": correct,
        "explanation": case.explanation if correct else None,
        "correct_mineral": correct_name,
        "card_reward": card_reward,
        "attempts": history.attempts if history else 1,
        "new_badges": new_badges,
    }
