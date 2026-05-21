from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.api.deps import get_current_user, require_operator
from app.models.field_guide import FieldGuide
from app.models.user import User, UserRole

router = APIRouter()


class GuideCreate(BaseModel):
    slug: str
    title: str
    mineral_tags: list[str] = []
    difficulty: str = "beginner"
    body: str = ""
    cover_image: str = ""


class GuideUpdate(BaseModel):
    title: str | None = None
    mineral_tags: list[str] | None = None
    difficulty: str | None = None
    body: str | None = None
    cover_image: str | None = None
    is_published: bool | None = None


def _guide_dict(g: FieldGuide) -> dict:
    return {
        "id": str(g.id),
        "slug": g.slug,
        "title": g.title,
        "mineral_tags": g.mineral_tags,
        "difficulty": g.difficulty,
        "body": g.body,
        "cover_image": g.cover_image,
        "is_published": g.is_published,
        "created_at": g.created_at.isoformat(),
    }


@router.get("/")
async def list_guides(
    mineral: str | None = Query(None),
    difficulty: str | None = Query(None),
) -> list[dict]:
    query = FieldGuide.find(FieldGuide.is_published == True)  # noqa: E712
    if mineral:
        query = query.find({"mineral_tags": mineral})
    if difficulty:
        query = query.find(FieldGuide.difficulty == difficulty)
    guides = await query.to_list()
    return [_guide_dict(g) for g in guides]


@router.get("/{slug}")
async def get_guide(slug: str) -> dict:
    g = await FieldGuide.find_one(FieldGuide.slug == slug, FieldGuide.is_published == True)  # noqa: E712
    if not g:
        raise HTTPException(status_code=404, detail="Guide not found")
    return _guide_dict(g)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_guide(
    body: GuideCreate,
    user: User = Depends(require_operator),
) -> dict:
    existing = await FieldGuide.find_one(FieldGuide.slug == body.slug)
    if existing:
        raise HTTPException(status_code=409, detail="Slug already taken")
    g = FieldGuide(**body.model_dump())
    await g.insert()
    return _guide_dict(g)


@router.patch("/{slug}")
async def update_guide(
    slug: str,
    body: GuideUpdate,
    user: User = Depends(get_current_user),
) -> dict:
    if user.role not in (UserRole.ADMIN, UserRole.OPERATOR):
        raise HTTPException(status_code=403, detail="Operators only")
    g = await FieldGuide.find_one(FieldGuide.slug == slug)
    if not g:
        raise HTTPException(status_code=404, detail="Guide not found")
    await g.set(body.model_dump(exclude_none=True))
    await g.sync()
    return _guide_dict(g)


@router.delete("/{slug}")
async def delete_guide(slug: str, user: User = Depends(get_current_user)) -> dict:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    g = await FieldGuide.find_one(FieldGuide.slug == slug)
    if not g:
        raise HTTPException(status_code=404, detail="Guide not found")
    await g.delete()
    return {"deleted": True}
