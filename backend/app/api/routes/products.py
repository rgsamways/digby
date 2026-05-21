from fastapi import APIRouter, HTTPException, Query

from app.models.product import Product

router = APIRouter()


def _product_dict(p: Product) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "slug": p.slug,
        "category": p.category,
        "subcategory": p.subcategory,
        "description": p.description,
        "price": p.price,
        "images": p.images,
        "stock": p.stock,
        "dropship": p.dropship,
        "tags": p.tags,
        "related_products": p.related_products,
        "site_recommendations": p.site_recommendations,
    }


@router.get("/")
async def list_products(
    category: str | None = Query(None),
    subcategory: str | None = Query(None),
    tag: str | None = Query(None),
    site_slug: str | None = Query(None),
    skip: int = 0,
    limit: int = 24,
) -> list[dict]:
    query: dict = {"active": True}
    if category:
        query["category"] = category
    if subcategory:
        query["subcategory"] = subcategory
    if tag:
        query["tags"] = tag
    if site_slug:
        query["site_recommendations"] = site_slug
    products = await Product.find(query).skip(skip).limit(limit).to_list()
    return [_product_dict(p) for p in products]


@router.get("/{id_or_slug}")
async def get_product(id_or_slug: str) -> dict:
    from beanie import PydanticObjectId

    product: Product | None = None
    try:
        oid = PydanticObjectId(id_or_slug)
        product = await Product.get(oid)
        if product and not product.active:
            product = None
    except Exception:
        product = await Product.find_one({"slug": id_or_slug, "active": True})

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    related: list[Product] = []
    if product.related_products:
        from beanie import PydanticObjectId as OID
        for rid in product.related_products[:4]:
            try:
                rel = await Product.get(OID(rid))
                if rel and rel.active:
                    related.append(rel)
            except Exception:
                pass

    return {**_product_dict(product), "related": [_product_dict(r) for r in related]}
