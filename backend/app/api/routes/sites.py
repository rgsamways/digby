from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.api.deps import get_current_user, require_operator
from app.models.site import GeoPoint, Site, SiteType
from app.models.user import User

router = APIRouter()


class SiteCreate(BaseModel):
    name: str
    description: str
    longitude: float
    latitude: float
    address: str
    province: str = "Ontario"
    minerals: list[str] = []
    price_per_person: float
    max_group_size: int = 10
    duration_hours: float = 3.0
    site_type: SiteType = SiteType.PAY_TO_DIG
    rules: str = ""


class SiteUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price_per_person: float | None = None
    max_group_size: int | None = None
    minerals: list[str] | None = None
    rules: str | None = None
    is_active: bool | None = None


@router.get("/")
async def list_sites(
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    radius_km: float = Query(50.0),
    mineral: str | None = Query(None),
    site_type: SiteType | None = Query(None),
    limit: int = Query(20, le=100),
    skip: int = Query(0),
) -> list[dict]:
    query = Site.find(Site.is_active == True)  # noqa: E712

    if mineral:
        query = query.find({"minerals": mineral})
    if site_type:
        query = query.find(Site.site_type == site_type)

    sites = await query.skip(skip).limit(limit).to_list()
    return [_site_to_dict(s) for s in sites]


@router.get("/my")
async def my_sites(operator: User = Depends(require_operator)) -> list[dict]:
    sites = await Site.find(Site.operator_id == operator.id).to_list()
    return [_site_to_dict(s) for s in sites]


@router.get("/{site_id}")
async def get_site(site_id: PydanticObjectId) -> dict:
    site = await Site.get(site_id)
    if not site or not site.is_active:
        raise HTTPException(status_code=404, detail="Site not found")
    return _site_to_dict(site)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_site(
    body: SiteCreate,
    operator: User = Depends(require_operator),
) -> dict:
    site = Site(
        operator_id=operator.id,
        name=body.name,
        description=body.description,
        location=GeoPoint(coordinates=[body.longitude, body.latitude]),
        address=body.address,
        province=body.province,
        minerals=body.minerals,
        price_per_person=body.price_per_person,
        max_group_size=body.max_group_size,
        duration_hours=body.duration_hours,
        site_type=body.site_type,
        rules=body.rules,
    )
    await site.insert()
    return _site_to_dict(site)


@router.patch("/{site_id}")
async def update_site(
    site_id: PydanticObjectId,
    body: SiteUpdate,
    operator: User = Depends(require_operator),
) -> dict:
    site = await Site.get(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    if site.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not your site")

    update_data = body.model_dump(exclude_none=True)
    await site.set(update_data)
    return _site_to_dict(site)


def _site_to_dict(site: Site) -> dict:
    return {
        "id": str(site.id),
        "operator_id": str(site.operator_id),
        "name": site.name,
        "description": site.description,
        "location": site.location.model_dump(),
        "address": site.address,
        "province": site.province,
        "minerals": site.minerals,
        "price_per_person": site.price_per_person,
        "max_group_size": site.max_group_size,
        "duration_hours": site.duration_hours,
        "site_type": site.site_type,
        "images": site.images,
        "rules": site.rules,
        "is_active": site.is_active,
        "rating": site.rating,
        "review_count": site.review_count,
    }
