from datetime import UTC, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import require_admin_token
from app.core.config import settings
from app.core.security import create_access_token
from app.models.product import Product
from app.models.shop_order import ShopOrder, ShopOrderStatus
from app.models.user import User

router = APIRouter()


class AdminLoginIn(BaseModel):
    password: str


@router.post("/login")
async def admin_login(body: AdminLoginIn) -> dict:
    if not settings.ADMIN_PASSWORD or body.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    token = create_access_token(subject="admin", role="admin")
    return {"token": token}


# ── Products ──────────────────────────────────────────────────────────────────

class ProductIn(BaseModel):
    name: str
    slug: str
    category: str
    subcategory: str = ""
    description: str = ""
    price: int = 0
    cost: int = 0
    images: list[str] = []
    sku: str = ""
    supplier: str = ""
    stock: int = 0
    dropship: bool = False
    active: bool = True
    tags: list[str] = []
    related_products: list[str] = []
    site_recommendations: list[str] = []


def _product_dict(p: Product) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "slug": p.slug,
        "category": p.category,
        "subcategory": p.subcategory,
        "description": p.description,
        "price": p.price,
        "cost": p.cost,
        "images": p.images,
        "sku": p.sku,
        "supplier": p.supplier,
        "stock": p.stock,
        "dropship": p.dropship,
        "active": p.active,
        "tags": p.tags,
        "related_products": p.related_products,
        "site_recommendations": p.site_recommendations,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


@router.get("/products")
async def admin_list_products(
    skip: int = 0,
    limit: int = 50,
    _: None = Depends(require_admin_token),
) -> list[dict]:
    products = await Product.find().sort("-created_at").skip(skip).limit(limit).to_list()
    return [_product_dict(p) for p in products]


@router.post("/products")
async def admin_create_product(
    body: ProductIn,
    _: None = Depends(require_admin_token),
) -> dict:
    if await Product.find_one({"slug": body.slug}):
        raise HTTPException(status_code=409, detail="Slug already in use")
    product = Product(**body.model_dump())
    await product.insert()
    return _product_dict(product)


@router.put("/products/{product_id}")
async def admin_update_product(
    product_id: str,
    body: ProductIn,
    _: None = Depends(require_admin_token),
) -> dict:
    try:
        product = await Product.get(PydanticObjectId(product_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if body.slug != product.slug and await Product.find_one({"slug": body.slug}):
        raise HTTPException(status_code=409, detail="Slug already in use")

    for field, value in body.model_dump().items():
        setattr(product, field, value)
    product.updated_at = datetime.now(UTC)
    await product.save()
    return _product_dict(product)


@router.delete("/products/{product_id}")
async def admin_deactivate_product(
    product_id: str,
    _: None = Depends(require_admin_token),
) -> dict:
    try:
        product = await Product.get(PydanticObjectId(product_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.active = False
    product.updated_at = datetime.now(UTC)
    await product.save()
    return {"ok": True}


# ── Orders ────────────────────────────────────────────────────────────────────

def _order_dict(o: ShopOrder, user_email: str = "") -> dict:
    return {
        "id": str(o.id),
        "user_id": o.user_id,
        "user_email": user_email,
        "items": [i.model_dump() for i in o.items],
        "total": o.total,
        "status": o.status,
        "stripe_payment_intent_id": o.stripe_payment_intent_id,
        "shipping_address": o.shipping_address,
        "tracking_number": o.tracking_number,
        "created_at": o.created_at.isoformat(),
    }


async def _enrich_order(o: ShopOrder) -> dict:
    user_email = ""
    try:
        user = await User.get(PydanticObjectId(o.user_id))
        if user:
            user_email = user.email or ""
    except Exception:
        pass
    return _order_dict(o, user_email)


@router.get("/orders")
async def admin_list_orders(
    skip: int = 0,
    limit: int = 50,
    status: str | None = None,
    _: None = Depends(require_admin_token),
) -> list[dict]:
    query: dict = {}
    if status:
        query["status"] = status
    orders = await ShopOrder.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    return [await _enrich_order(o) for o in orders]


@router.get("/orders/{order_id}")
async def admin_get_order(
    order_id: str,
    _: None = Depends(require_admin_token),
) -> dict:
    try:
        order = await ShopOrder.get(PydanticObjectId(order_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return await _enrich_order(order)


class OrderStatusIn(BaseModel):
    status: str
    tracking_number: str = ""


@router.patch("/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: str,
    body: OrderStatusIn,
    _: None = Depends(require_admin_token),
) -> dict:
    try:
        order = await ShopOrder.get(PydanticObjectId(order_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        order.status = ShopOrderStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")

    if body.tracking_number:
        order.tracking_number = body.tracking_number
    await order.save()
    return {"ok": True, "status": order.status}
