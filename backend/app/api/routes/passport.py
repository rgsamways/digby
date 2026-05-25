from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.diary_entry import DiaryEntry
from app.models.find import Find
from app.models.hunt_progress import HuntProgress
from app.models.passport_stamp import PassportStamp
from app.models.quiz_result import QuizResult
from app.models.user import User

router = APIRouter()

BADGES = [
    {"id": "first_dig", "name": "First Dig", "description": "Complete your first site visit",
     "threshold": 1},
    {"id": "rock_hound", "name": "Rock Hound", "description": "Visit 5 sites", "threshold": 5},
    {"id": "gem_hunter", "name": "Gem Hunter", "description": "Visit 10 sites", "threshold": 10},
    {"id": "mineral_master", "name": "Mineral Master", "description": "Visit 25 sites",
     "threshold": 25},
]

STAMP_POINTS = 25
MINERAL_POINTS = 10
HUNT_POINTS = 100


def _compute_points(
    stamp_count: int,
    unique_mineral_count: int,
    hunt_count: int,
    quiz_points: int,
    diary_points: int,
) -> int:
    return (
        stamp_count * STAMP_POINTS
        + unique_mineral_count * MINERAL_POINTS
        + hunt_count * HUNT_POINTS
        + quiz_points
        + diary_points
    )


@router.get("/me")
async def my_passport(visitor: User = Depends(get_current_user)) -> dict:
    stamps = await PassportStamp.find(
        PassportStamp.visitor_id == visitor.id
    ).sort(-PassportStamp.visited_at).to_list()

    earned_badges = [b for b in BADGES if len(stamps) >= b["threshold"]]

    all_minerals: set[str] = set()
    for s in stamps:
        all_minerals.update(s.minerals_found)

    hunt_completions = await HuntProgress.find(
        HuntProgress.visitor_id == visitor.id,
        HuntProgress.completed_at != None,  # noqa: E711
    ).count()

    quiz_results = await QuizResult.find(QuizResult.visitor_id == visitor.id).to_list()
    quiz_points = sum(r.points_awarded for r in quiz_results)

    diary_entries = await DiaryEntry.find(DiaryEntry.visitor_id == visitor.id).to_list()
    diary_points = sum(e.points_awarded for e in diary_entries)

    cs_finds = await Find.find(
        Find.user_id == visitor.id,
        Find.citizen_science_opted_in == True,  # noqa: E712
    ).count()

    total_points = _compute_points(
        len(stamps), len(all_minerals), hunt_completions, quiz_points, diary_points
    )

    return {
        "visitor_name": visitor.name,
        "total_visits": len(stamps),
        "total_points": total_points,
        "hunt_completions": hunt_completions,
        "quiz_sessions": len(quiz_results),
        "diary_entries": len(diary_entries),
        "citizen_science_finds": cs_finds,
        "unique_minerals": sorted(all_minerals),
        "badges": earned_badges,
        "stamps": [_stamp_dict(s) for s in stamps],
    }


@router.get("/leaderboard")
async def leaderboard() -> list[dict]:
    from collections import defaultdict

    all_stamps = await PassportStamp.find_all().to_list()
    completed_hunts = await HuntProgress.find(
        HuntProgress.completed_at != None  # noqa: E711
    ).to_list()
    all_quiz = await QuizResult.find_all().to_list()

    stamps_by_visitor: dict = defaultdict(list)
    for s in all_stamps:
        stamps_by_visitor[str(s.visitor_id)].append(s)

    hunts_by_visitor: dict = defaultdict(int)
    for h in completed_hunts:
        hunts_by_visitor[str(h.visitor_id)] += 1

    quiz_pts_by_visitor: dict = defaultdict(int)
    for qr in all_quiz:
        quiz_pts_by_visitor[str(qr.visitor_id)] += qr.points_awarded

    all_diary = await DiaryEntry.find_all().to_list()
    diary_pts_by_visitor: dict = defaultdict(int)
    for de in all_diary:
        diary_pts_by_visitor[str(de.visitor_id)] += de.points_awarded

    visitor_ids = (
        set(stamps_by_visitor.keys())
        | set(hunts_by_visitor.keys())
        | set(quiz_pts_by_visitor.keys())
        | set(diary_pts_by_visitor.keys())
    )
    scores: list[tuple[str, int, int]] = []
    for vid in visitor_ids:
        vstamps = stamps_by_visitor[vid]
        minerals: set[str] = set()
        for s in vstamps:
            minerals.update(s.minerals_found)
        pts = _compute_points(
            len(vstamps), len(minerals),
            hunts_by_visitor[vid], quiz_pts_by_visitor[vid], diary_pts_by_visitor[vid],
        )
        scores.append((vid, pts, len(vstamps)))

    scores.sort(key=lambda x: x[1], reverse=True)

    result = []
    for vid, pts, visits in scores[:10]:
        user = await User.get(PydanticObjectId(vid))
        if user:
            result.append({"name": user.name, "points": pts, "visits": visits})

    return result


@router.get("/{visitor_id}")
async def get_passport(visitor_id: str) -> dict:
    try:
        oid = PydanticObjectId(visitor_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Passport not found")

    visitor = await User.get(oid)
    if not visitor:
        raise HTTPException(status_code=404, detail="Passport not found")

    stamps = await PassportStamp.find(
        PassportStamp.visitor_id == oid
    ).sort(-PassportStamp.visited_at).to_list()

    earned_badges = [b for b in BADGES if len(stamps) >= b["threshold"]]
    all_minerals: set[str] = set()
    for s in stamps:
        all_minerals.update(s.minerals_found)

    hunt_completions = await HuntProgress.find(
        HuntProgress.visitor_id == oid,
        HuntProgress.completed_at != None,  # noqa: E711
    ).count()

    quiz_results = await QuizResult.find(QuizResult.visitor_id == oid).to_list()
    quiz_points = sum(r.points_awarded for r in quiz_results)

    diary_entries = await DiaryEntry.find(DiaryEntry.visitor_id == oid).to_list()
    diary_points = sum(e.points_awarded for e in diary_entries)

    cs_finds = await Find.find(
        Find.user_id == oid,
        Find.citizen_science_opted_in == True,  # noqa: E712
    ).count()

    total_points = _compute_points(
        len(stamps), len(all_minerals), hunt_completions, quiz_points, diary_points
    )

    return {
        "visitor_name": visitor.name,
        "total_visits": len(stamps),
        "total_points": total_points,
        "hunt_completions": hunt_completions,
        "quiz_sessions": len(quiz_results),
        "diary_entries": len(diary_entries),
        "citizen_science_finds": cs_finds,
        "unique_minerals": sorted(all_minerals),
        "badges": earned_badges,
        "stamps": [_stamp_dict(s) for s in stamps],
    }


class StampCreate(BaseModel):
    booking_id: str
    site_id: str
    site_name: str
    minerals_found: list[str] = []
    visited_at: str


@router.post("/stamp")
async def add_stamp(
    body: StampCreate,
    visitor: User = Depends(get_current_user),
) -> dict:
    from datetime import datetime
    existing = await PassportStamp.find_one(
        PassportStamp.visitor_id == visitor.id,
        PassportStamp.booking_id == PydanticObjectId(body.booking_id),
    )
    if existing:
        raise HTTPException(status_code=409, detail="Stamp already exists for this booking")

    stamp = PassportStamp(
        visitor_id=visitor.id,
        site_id=PydanticObjectId(body.site_id),
        site_name=body.site_name,
        minerals_found=body.minerals_found,
        visited_at=datetime.fromisoformat(body.visited_at),
        booking_id=PydanticObjectId(body.booking_id),
    )
    await stamp.insert()
    return _stamp_dict(stamp)


def _stamp_dict(s: PassportStamp) -> dict:
    return {
        "id": str(s.id),
        "site_id": str(s.site_id),
        "site_name": s.site_name,
        "minerals_found": s.minerals_found,
        "visited_at": s.visited_at.isoformat(),
        "booking_id": str(s.booking_id),
    }
