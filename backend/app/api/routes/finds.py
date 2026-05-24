import csv
import io
from datetime import UTC, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.api.deps import get_current_user, get_current_user_optional, require_admin_token
from app.models.find import Find, FindSave, FindVisibility, VerificationStatus
from app.models.site import Site
from app.models.user import User

router = APIRouter()


def _cs_eligible(find: Find) -> bool:
    return (
        find.gps_lat is not None
        and find.gps_lng is not None
        and len(find.photo_urls) > 0
        and find.verification_status
        in (VerificationStatus.AI_LIKELY, VerificationStatus.COMMUNITY_VERIFIED,
            VerificationStatus.OGS_REVIEWED)
        and find.host_rock is not None
        and find.citizen_science_opted_in
    )


class FindCreate(BaseModel):
    mineral_name: str
    date: str  # ISO date string
    notes: str = ""
    photo_urls: list[str] = []
    gps_lat: float | None = None
    gps_lng: float | None = None
    site_id: str | None = None
    host_rock: str | None = None
    geological_province: str | None = None
    formation: str | None = None
    specimen_quality: str | None = None
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED
    citizen_science_opted_in: bool = False
    visibility: FindVisibility = FindVisibility.PUBLIC
    is_junior_submission: bool = False
    uv_fluorescence: str | None = None
    is_haul: bool = False


class FindUpdate(BaseModel):
    mineral_name: str | None = None
    date: str | None = None
    notes: str | None = None
    photo_urls: list[str] | None = None
    gps_lat: float | None = None
    gps_lng: float | None = None
    host_rock: str | None = None
    geological_province: str | None = None
    formation: str | None = None
    specimen_quality: str | None = None
    verification_status: VerificationStatus | None = None
    citizen_science_opted_in: bool | None = None
    visibility: FindVisibility | None = None
    uv_fluorescence: str | None = None
    is_haul: bool | None = None


def _find_dict(find: Find, author_name: str, saved: bool = False) -> dict:
    return {
        "id": str(find.id),
        "user_id": str(find.user_id),
        "author_name": author_name,
        "date": find.date.isoformat(),
        "mineral_name": find.mineral_name,
        "notes": find.notes,
        "photo_urls": find.photo_urls,
        "gps_lat": find.gps_lat,
        "gps_lng": find.gps_lng,
        "site_id": str(find.site_id) if find.site_id else None,
        "site_name": find.site_name,
        "host_rock": find.host_rock,
        "geological_province": find.geological_province,
        "formation": find.formation,
        "specimen_quality": find.specimen_quality,
        "verification_status": find.verification_status,
        "citizen_science_opted_in": find.citizen_science_opted_in,
        "citizen_science_eligible": find.citizen_science_eligible,
        "visibility": find.visibility,
        "save_count": find.save_count,
        "is_featured": find.is_featured,
        "is_junior_submission": find.is_junior_submission,
        "uv_fluorescence": find.uv_fluorescence,
        "is_haul": find.is_haul,
        "saved": saved,
        "created_at": find.created_at.isoformat(),
    }


@router.post("/")
async def create_find(body: FindCreate, user: User = Depends(get_current_user)) -> dict:
    site_name: str | None = None
    site_oid: PydanticObjectId | None = None
    if body.site_id:
        site = await Site.get(PydanticObjectId(body.site_id))
        if site:
            site_oid = site.id
            site_name = site.name

    find = Find(
        user_id=user.id,
        date=datetime.fromisoformat(body.date),
        mineral_name=body.mineral_name,
        notes=body.notes,
        photo_urls=body.photo_urls,
        gps_lat=body.gps_lat,
        gps_lng=body.gps_lng,
        site_id=site_oid,
        site_name=site_name,
        host_rock=body.host_rock,
        geological_province=body.geological_province,
        formation=body.formation,
        specimen_quality=body.specimen_quality,
        verification_status=body.verification_status,
        citizen_science_opted_in=body.citizen_science_opted_in,
        visibility=body.visibility,
        is_junior_submission=body.is_junior_submission,
        uv_fluorescence=body.uv_fluorescence,
        is_haul=body.is_haul,
    )
    find.citizen_science_eligible = _cs_eligible(find)
    await find.insert()
    return _find_dict(find, user.name)


@router.get("/my")
async def my_finds(user: User = Depends(get_current_user)) -> list[dict]:
    finds = await Find.find(Find.user_id == user.id).sort(-Find.created_at).to_list()
    return [_find_dict(f, user.name) for f in finds]


@router.get("/feed")
async def public_feed(
    mineral: str = Query(""),
    province: str = Query(""),
    verification: str = Query(""),
    featured_only: bool = Query(False),
    uv_only: bool = Query(False),
    uv_colour: str = Query(""),
    haul_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> dict:
    q: dict = {"visibility": FindVisibility.PUBLIC}
    if mineral:
        q["mineral_name"] = {"$regex": mineral, "$options": "i"}
    if province:
        q["geological_province"] = province
    if verification:
        q["verification_status"] = verification
    if featured_only:
        q["is_featured"] = True
    if uv_only or uv_colour:
        q["uv_fluorescence"] = {"$ne": None}
    if uv_colour:
        q["uv_fluorescence"] = uv_colour
    if haul_only:
        q["is_haul"] = True

    total = await Find.find(q).count()
    finds = await Find.find(q).sort(-Find.created_at).skip(skip).limit(limit).to_list()

    items = []
    for f in finds:
        author = await User.get(f.user_id)
        items.append(_find_dict(f, author.name if author else "Rockhound"))

    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.get("/feed/saved")
async def saved_finds(
    user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> dict:
    saves = (
        await FindSave.find(FindSave.user_id == user.id)
        .sort(-FindSave.saved_at)
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    find_ids = [s.find_id for s in saves]
    finds = await Find.find(
        {"_id": {"$in": find_ids}, "visibility": FindVisibility.PUBLIC}
    ).to_list()
    find_map = {f.id: f for f in finds}

    items = []
    for s in saves:
        f = find_map.get(s.find_id)
        if f:
            author = await User.get(f.user_id)
            items.append(_find_dict(f, author.name if author else "Rockhound", saved=True))

    return {"total": len(items), "skip": skip, "limit": limit, "items": items}


@router.get("/{find_id}")
async def get_find(
    find_id: PydanticObjectId,
    user: User | None = Depends(get_current_user_optional),
) -> dict:
    find = await Find.get(find_id)
    if not find:
        raise HTTPException(status_code=404, detail="Find not found")
    if find.visibility == FindVisibility.PRIVATE and (not user or find.user_id != user.id):
        raise HTTPException(status_code=404, detail="Find not found")

    author = await User.get(find.user_id)
    saved = False
    if user:
        existing_save = await FindSave.find_one(
            FindSave.user_id == user.id, FindSave.find_id == find.id
        )
        saved = existing_save is not None

    return _find_dict(find, author.name if author else "Rockhound", saved=saved)


@router.patch("/{find_id}")
async def update_find(
    find_id: PydanticObjectId,
    body: FindUpdate,
    user: User = Depends(get_current_user),
) -> dict:
    find = await Find.get(find_id)
    if not find or find.user_id != user.id:
        raise HTTPException(status_code=404, detail="Find not found")

    updates: dict = {"updated_at": datetime.now(UTC)}
    for field in (
        "mineral_name", "notes", "photo_urls", "gps_lat", "gps_lng",
        "host_rock", "geological_province", "formation", "specimen_quality",
        "verification_status", "citizen_science_opted_in", "visibility",
    ):
        val = getattr(body, field)
        if val is not None:
            updates[field] = val
    if body.date is not None:
        updates["date"] = datetime.fromisoformat(body.date)

    await find.set(updates)
    await find.sync()
    find.citizen_science_eligible = _cs_eligible(find)
    await find.set({"citizen_science_eligible": find.citizen_science_eligible})
    return _find_dict(find, user.name)


@router.delete("/{find_id}")
async def delete_find(
    find_id: PydanticObjectId,
    user: User = Depends(get_current_user),
) -> dict:
    find = await Find.get(find_id)
    if not find or find.user_id != user.id:
        raise HTTPException(status_code=404, detail="Find not found")
    await FindSave.find(FindSave.find_id == find.id).delete()
    await find.delete()
    return {"deleted": True}


@router.post("/{find_id}/save")
async def toggle_save(
    find_id: PydanticObjectId,
    user: User = Depends(get_current_user),
) -> dict:
    find = await Find.get(find_id)
    if not find or find.visibility != FindVisibility.PUBLIC:
        raise HTTPException(status_code=404, detail="Find not found")

    existing = await FindSave.find_one(FindSave.user_id == user.id, FindSave.find_id == find.id)
    if existing:
        await existing.delete()
        await find.set({"save_count": max(0, find.save_count - 1)})
        return {"saved": False, "save_count": find.save_count - 1}
    else:
        await FindSave(user_id=user.id, find_id=find.id).insert()
        await find.set({"save_count": find.save_count + 1})
        return {"saved": True, "save_count": find.save_count + 1}


@router.get("/admin/export")
async def export_citizen_science(
    _: None = Depends(require_admin_token),
) -> StreamingResponse:
    finds = await Find.find({
        "citizen_science_eligible": True,
        "visibility": FindVisibility.PUBLIC,
    }).sort(-Find.created_at).to_list()

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "find_id", "date", "mineral_name", "formation", "host_rock",
        "geological_province", "gps_lat", "gps_lng", "verification_status",
        "photo_count", "site_name", "notes", "is_junior",
    ])
    writer.writeheader()
    for f in finds:
        writer.writerow({
            "find_id": str(f.id),
            "date": f.date.date().isoformat(),
            "mineral_name": f.mineral_name,
            "formation": f.formation or "",
            "host_rock": f.host_rock or "",
            "geological_province": f.geological_province or "",
            "gps_lat": f.gps_lat or "",
            "gps_lng": f.gps_lng or "",
            "verification_status": f.verification_status,
            "photo_count": len(f.photo_urls),
            "site_name": f.site_name or "",
            "notes": f.notes,
            "is_junior": f.is_junior_submission,
        })

    output.seek(0)
    filename = f"digby-citizen-science-{datetime.now(UTC).date()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
