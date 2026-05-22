from fastapi import APIRouter

from app.models.site import Site

router = APIRouter()


@router.get("/sites")
async def map_sites() -> dict:
    sites = await Site.find({"is_active": True}).to_list()
    features = []
    for s in sites:
        coords = s.location.coordinates if s.location else None
        if not coords or len(coords) < 2:
            continue
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": coords},
            "properties": {
                "id": str(s.id),
                "name": s.name,
                "slug": str(s.id),  # site detail page uses ID for now
                "minerals": s.minerals,
                "site_type": s.site_type,
                "price_per_person": s.price_per_person,
                "thumbnail": s.images[0] if s.images else None,
            },
        })
    return {"type": "FeatureCollection", "features": features}
