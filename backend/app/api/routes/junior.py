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


async def _evaluate_badges(user_id: str, junior_id: str, trigger: str) -> list[str]:
    """Grant any newly-earned badges and return their IDs."""
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
    mineral_map = {m.mineral_id: m for m in all_minerals}
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

        if bid == "first_find":
            earned_flag = len(collection) >= 1
        elif bid == "field_5":
            earned_flag = len(collection) >= 5
        elif bid == "field_20":
            earned_flag = len(collection) >= 20
        elif bid == "rarity_rare":
            earned_flag = any(
                mineral_map.get(c.mineral_id) and
                mineral_map[c.mineral_id].rarity in (RarityTier.RARE, RarityTier.LEGENDARY)
                for c in collection
            )
        elif bid == "rarity_legendary":
            earned_flag = any(
                mineral_map.get(c.mineral_id) and
                mineral_map[c.mineral_id].rarity == RarityTier.LEGENDARY
                for c in collection
            )
        elif bid == "streak_7":
            earned_flag = junior is not None and junior.login_streak >= 7
        elif bid == "full_set":
            all_ids = {m.mineral_id for m in all_minerals}
            earned_flag = bool(all_minerals) and all_ids == collected_ids
        elif bid == "detective_1":
            earned_flag = len(detective_solved) >= 1
        elif bid == "detective_5":
            earned_flag = len(detective_solved) >= 5
        elif bid == "detective_all":
            total_cases = len(await DetectiveCase.find().to_list())
            earned_flag = total_cases > 0 and len(detective_solved) >= total_cases

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


async def award_booking_badge(user_id: str, junior_id: str) -> list[str]:
    """Called from bookings route when a booking completes."""
    earned = await BadgeState.find(
        BadgeState.user_id == user_id,
        BadgeState.junior_id == junior_id,
        BadgeState.badge_id == "booking_first",
    ).to_list()
    if earned:
        return []
    badge = await Badge.find_one(Badge.badge_id == "booking_first")
    if not badge:
        return []
    state = BadgeState(
        user_id=user_id, junior_id=junior_id,
        badge_id="booking_first", trigger_event="booking_complete",
    )
    await state.insert()
    if badge.card_reward:
        await _unlock_card(user_id, junior_id, badge.card_reward, UnlockSource.BOOKING)
    return ["booking_first"]


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
