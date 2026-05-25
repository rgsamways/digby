import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.club import Club, ClubMembership
from app.models.find import Find, FindVisibility
from app.models.user import User

router = APIRouter()


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


class ClubCreate(BaseModel):
    name: str
    description: str = ""
    is_public: bool = True


async def _club_dict(club: Club, member_count: int) -> dict:
    return {
        "id": str(club.id),
        "name": club.name,
        "description": club.description,
        "slug": club.slug,
        "owner_id": club.owner_id,
        "is_public": club.is_public,
        "member_count": member_count,
        "created_at": club.created_at.isoformat(),
    }


@router.post("/", status_code=201)
async def create_club(body: ClubCreate, user: User = Depends(get_current_user)) -> dict:
    base_slug = _slugify(body.name) or "club"
    slug = base_slug
    counter = 1
    while await Club.find_one(Club.slug == slug):
        slug = f"{base_slug}-{counter}"
        counter += 1

    club = Club(
        name=body.name.strip(),
        description=body.description.strip(),
        owner_id=str(user.id),
        slug=slug,
        is_public=body.is_public,
    )
    await club.insert()

    await ClubMembership(
        club_id=str(club.id),
        user_id=str(user.id),
        role="owner",
    ).insert()

    return await _club_dict(club, 1)


@router.get("/")
async def list_clubs(user: User = Depends(get_current_user)) -> list:
    """Return all public clubs plus any private clubs the user belongs to."""
    public = await Club.find(Club.is_public == True).to_list()  # noqa: E712
    my_memberships = await ClubMembership.find(
        ClubMembership.user_id == str(user.id)
    ).to_list()
    my_club_ids = {m.club_id for m in my_memberships}

    # Add private clubs the user is already in
    private_mine = await Club.find(
        Club.is_public == False,  # noqa: E712
    ).to_list()
    private_mine = [c for c in private_mine if str(c.id) in my_club_ids]

    seen: set[str] = set()
    result = []
    for club in public + private_mine:
        cid = str(club.id)
        if cid in seen:
            continue
        seen.add(cid)
        count = await ClubMembership.find(ClubMembership.club_id == cid).count()
        d = await _club_dict(club, count)
        d["is_member"] = cid in my_club_ids
        result.append(d)

    return result


@router.get("/mine")
async def my_clubs(user: User = Depends(get_current_user)) -> list:
    memberships = await ClubMembership.find(
        ClubMembership.user_id == str(user.id)
    ).to_list()
    result = []
    for m in memberships:
        club = await Club.get(m.club_id)
        if club:
            count = await ClubMembership.find(ClubMembership.club_id == m.club_id).count()
            d = await _club_dict(club, count)
            d["role"] = m.role
            result.append(d)
    return result


@router.get("/{slug}")
async def get_club(slug: str, user: User = Depends(get_current_user)) -> dict:
    club = await Club.find_one(Club.slug == slug)
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    cid = str(club.id)
    memberships = await ClubMembership.find(ClubMembership.club_id == cid).to_list()
    member_ids = [m.user_id for m in memberships]

    if not club.is_public and str(user.id) not in member_ids:
        raise HTTPException(status_code=403, detail="Private club")

    members = []
    for m in memberships:
        u = await User.get(m.user_id)
        if u:
            members.append({"id": m.user_id, "name": u.name, "role": m.role,
                            "joined_at": m.joined_at.isoformat()})

    # Aggregate recent public finds from all members
    from beanie import PydanticObjectId
    finds = []
    for mid in member_ids:
        try:
            oid = PydanticObjectId(mid)
            member_finds = await Find.find(
                Find.user_id == oid,
                Find.visibility == FindVisibility.PUBLIC,
            ).sort(-Find.created_at).limit(10).to_list()
            for f in member_finds:
                author = await User.get(f.user_id)
                finds.append({
                    "id": str(f.id),
                    "mineral_name": f.mineral_name,
                    "date": f.date.isoformat(),
                    "geological_province": f.geological_province,
                    "photo_url": f.photo_urls[0] if f.photo_urls else None,
                    "author_name": author.name if author else "Rockhound",
                    "verification_status": f.verification_status,
                })
        except Exception:
            pass

    finds.sort(key=lambda x: x["date"], reverse=True)

    d = await _club_dict(club, len(memberships))
    d["members"] = members
    d["recent_finds"] = finds[:30]
    d["is_member"] = str(user.id) in member_ids
    d["user_role"] = next((m.role for m in memberships if m.user_id == str(user.id)), None)
    return d


@router.post("/{slug}/join", status_code=201)
async def join_club(slug: str, user: User = Depends(get_current_user)) -> dict:
    club = await Club.find_one(Club.slug == slug)
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if not club.is_public:
        raise HTTPException(status_code=403, detail="Private club — request an invite")

    existing = await ClubMembership.find_one(
        ClubMembership.club_id == str(club.id),
        ClubMembership.user_id == str(user.id),
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already a member")

    await ClubMembership(
        club_id=str(club.id),
        user_id=str(user.id),
        role="member",
    ).insert()

    return {"joined": True}


@router.delete("/{slug}/leave")
async def leave_club(slug: str, user: User = Depends(get_current_user)) -> dict:
    club = await Club.find_one(Club.slug == slug)
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if club.owner_id == str(user.id):
        raise HTTPException(status_code=400, detail="Owner cannot leave — delete the club instead")

    membership = await ClubMembership.find_one(
        ClubMembership.club_id == str(club.id),
        ClubMembership.user_id == str(user.id),
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member")

    await membership.delete()
    return {"left": True}


@router.delete("/{slug}")
async def delete_club(slug: str, user: User = Depends(get_current_user)) -> dict:
    club = await Club.find_one(Club.slug == slug)
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if club.owner_id != str(user.id):
        raise HTTPException(status_code=403, detail="Only the owner can delete this club")

    await ClubMembership.find(ClubMembership.club_id == str(club.id)).delete()
    await club.delete()
    return {"deleted": True}
