import csv
import io
from datetime import UTC, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.api.deps import require_admin_token
from app.core.config import settings
from app.core.security import create_access_token
from app.models.booking import Booking, BookingStatus
from app.models.product import Product
from app.models.shop_order import ShopOrder, ShopOrderStatus
from app.models.site import Site
from app.models.strata import (
    BoxSiteLink,
    StrataBox,
    StrataFulfilment,
    StrataStatus,
    StrataSubscription,
)
from app.models.user import User, UserRole

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


# ── Strata ────────────────────────────────────────────────────────────────────

async def _enrich_sub(s: StrataSubscription) -> dict:
    user_name, user_email = "", ""
    try:
        user = await User.get(PydanticObjectId(s.user_id))
        if user:
            user_name = user.name
            user_email = user.email or ""
    except Exception:
        pass
    return {
        "id": str(s.id),
        "user_id": s.user_id,
        "user_name": user_name,
        "user_email": user_email,
        "tier": s.tier,
        "billing_frequency": s.billing_frequency,
        "status": s.status,
        "shipping_address": s.shipping_address,
        "is_gift": s.is_gift,
        "current_period_end": s.current_period_end.isoformat() if s.current_period_end else None,
        "created_at": s.created_at.isoformat(),
    }


@router.get("/strata/subscribers")
async def admin_strata_subscribers(
    status: str | None = None,
    _: None = Depends(require_admin_token),
) -> list[dict]:
    query: dict = {"status": {"$ne": StrataStatus.CANCELLED}} if not status else {"status": status}
    subs = await StrataSubscription.find(query).sort("-created_at").to_list()
    return [await _enrich_sub(s) for s in subs]


@router.get("/strata/boxes")
async def admin_strata_boxes(
    _: None = Depends(require_admin_token),
) -> list[dict]:
    boxes = await StrataBox.find().sort("month_number").to_list()
    return [
        {
            "month_number": b.month_number,
            "theme": b.theme,
            "is_published": b.is_published,
            "shipped_at": b.shipped_at.isoformat() if b.shipped_at else None,
        }
        for b in boxes
    ]


@router.get("/strata/fulfilment/{box_month}")
async def admin_strata_fulfilment(
    box_month: int,
    _: None = Depends(require_admin_token),
) -> list[dict]:
    subs = await StrataSubscription.find(
        {"status": {"$ne": StrataStatus.CANCELLED}}
    ).sort("-created_at").to_list()
    fulfilments = await StrataFulfilment.find(StrataFulfilment.box_month == box_month).to_list()
    ful_map = {f.subscription_id: f for f in fulfilments}

    result = []
    for s in subs:
        sub_id = str(s.id)
        ful = ful_map.get(sub_id)
        row = await _enrich_sub(s)
        row["shipped"] = ful is not None and ful.shipped_at is not None
        row["shipped_at"] = ful.shipped_at.isoformat() if ful and ful.shipped_at else None
        row["tracking_number"] = ful.tracking_number if ful else ""
        result.append(row)
    return result


class ShipIn(BaseModel):
    tracking_number: str = ""


@router.patch("/strata/fulfilment/{box_month}/{subscription_id}")
async def admin_mark_shipped(
    box_month: int,
    subscription_id: str,
    body: ShipIn,
    _: None = Depends(require_admin_token),
) -> dict:
    existing = await StrataFulfilment.find_one(
        StrataFulfilment.subscription_id == subscription_id,
        StrataFulfilment.box_month == box_month,
    )
    if existing:
        existing.shipped_at = datetime.now(UTC)
        existing.tracking_number = body.tracking_number
        await existing.save()
    else:
        await StrataFulfilment(
            subscription_id=subscription_id,
            box_month=box_month,
            shipped_at=datetime.now(UTC),
            tracking_number=body.tracking_number,
        ).insert()
    return {"ok": True}


@router.delete("/strata/fulfilment/{box_month}/{subscription_id}")
async def admin_unmark_shipped(
    box_month: int,
    subscription_id: str,
    _: None = Depends(require_admin_token),
) -> dict:
    existing = await StrataFulfilment.find_one(
        StrataFulfilment.subscription_id == subscription_id,
        StrataFulfilment.box_month == box_month,
    )
    if existing:
        existing.shipped_at = None
        existing.tracking_number = ""
        await existing.save()
    return {"ok": True}


@router.get("/strata/shipping-labels/{box_month}")
async def admin_shipping_labels_csv(
    box_month: int,
    _: None = Depends(require_admin_token),
) -> StreamingResponse:
    subs = await StrataSubscription.find(
        {"status": {"$ne": StrataStatus.CANCELLED}}
    ).to_list()
    fulfilments = await StrataFulfilment.find(
        StrataFulfilment.box_month == box_month,
        StrataFulfilment.shipped_at != None,  # noqa: E711
    ).to_list()
    shipped_ids = {f.subscription_id for f in fulfilments}

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "name", "email", "tier", "line1", "line2", "city", "province", "postal_code", "country",
    ])
    writer.writeheader()
    for s in subs:
        if str(s.id) in shipped_ids:
            continue
        user_name, user_email = "", ""
        try:
            user = await User.get(PydanticObjectId(s.user_id))
            if user:
                user_name = user.name
                user_email = user.email or ""
        except Exception:
            pass
        addr = s.shipping_address
        writer.writerow({
            "name": addr.get("name") or user_name,
            "email": user_email,
            "tier": s.tier,
            "line1": addr.get("line1", ""),
            "line2": addr.get("line2", ""),
            "city": addr.get("city", ""),
            "province": addr.get("province", ""),
            "postal_code": addr.get("postal_code", ""),
            "country": addr.get("country", "CA"),
        })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="strata-box-{box_month}-labels.csv"'},  # noqa: E501
    )


# ── Strata box editor ─────────────────────────────────────────────────────────

class BoxSiteLinkIn(BaseModel):
    site_slug: str
    site_name: str
    mineral: str


class StrataBoxIn(BaseModel):
    month_number: int
    theme: str
    subtitle: str = ""
    field_card_text: str = ""
    formation_map_url: str = ""
    cover_image_url: str = ""
    contents: list[str] = []
    site_links: list[BoxSiteLinkIn] = []
    is_published: bool = False


def _box_dict(b: StrataBox) -> dict:
    return {
        "month_number": b.month_number,
        "theme": b.theme,
        "subtitle": b.subtitle,
        "field_card_text": b.field_card_text,
        "formation_map_url": b.formation_map_url,
        "cover_image_url": b.cover_image_url,
        "contents": b.contents,
        "site_links": [sl.model_dump() for sl in b.site_links],
        "shipped_at": b.shipped_at.isoformat() if b.shipped_at else None,
        "is_published": b.is_published,
        "created_at": b.created_at.isoformat(),
    }


@router.get("/strata/boxes/{month_number}")
async def admin_get_box(
    month_number: int,
    _: None = Depends(require_admin_token),
) -> dict:
    box = await StrataBox.find_one(StrataBox.month_number == month_number)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    return _box_dict(box)


@router.post("/strata/boxes")
async def admin_create_box(
    body: StrataBoxIn,
    _: None = Depends(require_admin_token),
) -> dict:
    if await StrataBox.find_one(StrataBox.month_number == body.month_number):
        raise HTTPException(status_code=409, detail="Box month already exists")
    box = StrataBox(
        month_number=body.month_number,
        theme=body.theme,
        subtitle=body.subtitle,
        field_card_text=body.field_card_text,
        formation_map_url=body.formation_map_url,
        cover_image_url=body.cover_image_url,
        contents=body.contents,
        site_links=[BoxSiteLink(**sl.model_dump()) for sl in body.site_links],
        is_published=body.is_published,
    )
    await box.insert()
    return _box_dict(box)


@router.put("/strata/boxes/{month_number}")
async def admin_update_box(
    month_number: int,
    body: StrataBoxIn,
    _: None = Depends(require_admin_token),
) -> dict:
    box = await StrataBox.find_one(StrataBox.month_number == month_number)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    box.theme = body.theme
    box.subtitle = body.subtitle
    box.field_card_text = body.field_card_text
    box.formation_map_url = body.formation_map_url
    box.cover_image_url = body.cover_image_url
    box.contents = body.contents
    box.site_links = [BoxSiteLink(**sl.model_dump()) for sl in body.site_links]
    box.is_published = body.is_published
    await box.save()
    return _box_dict(box)


# ── Users ─────────────────────────────────────────────────────────────────────

def _user_dict(u: User) -> dict:
    return {
        "id": str(u.id),
        "email": u.email,
        "name": u.name,
        "role": u.role,
        "roles": u.roles,
        "email_flags": u.email_flags,
        "onboarding_answers": u.onboarding_answers,
        "is_active": u.is_active,
        "is_verified": u.is_verified,
        "stripe_account_enabled": u.stripe_account_enabled,
        "created_at": u.created_at.isoformat(),
    }


@router.get("/users")
async def admin_list_users(
    role: str | None = None,
    active: bool | None = None,
    skip: int = 0,
    limit: int = 100,
    _: None = Depends(require_admin_token),
) -> list[dict]:
    query: dict = {}
    if role:
        query["role"] = role
    if active is not None:
        query["is_active"] = active
    users = await User.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    return [_user_dict(u) for u in users]


@router.get("/users/flagged")
async def admin_list_flagged_users(
    flag: str | None = None,
    _: None = Depends(require_admin_token),
) -> list[dict]:
    """Return users with non-empty email_flags (partnership leads)."""
    users = await User.find().sort("-created_at").to_list()
    flagged = [u for u in users if u.email_flags]
    if flag:
        flagged = [u for u in flagged if flag in u.email_flags]
    return [_user_dict(u) for u in flagged]


class UserRoleIn(BaseModel):
    role: str


@router.patch("/users/{user_id}/role")
async def admin_set_user_role(
    user_id: str,
    body: UserRoleIn,
    _: None = Depends(require_admin_token),
) -> dict:
    try:
        user = await User.get(PydanticObjectId(user_id))
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        user.role = UserRole(body.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {body.role}")
    await user.save()
    return _user_dict(user)


class UserStatusIn(BaseModel):
    is_active: bool


@router.patch("/users/{user_id}/status")
async def admin_set_user_status(
    user_id: str,
    body: UserStatusIn,
    _: None = Depends(require_admin_token),
) -> dict:
    try:
        user = await User.get(PydanticObjectId(user_id))
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = body.is_active
    await user.save()
    return _user_dict(user)


# ── Sites (all) ───────────────────────────────────────────────────────────────

async def _site_dict(s: Site) -> dict:
    operator_name = ""
    try:
        op = await User.get(s.operator_id)
        if op:
            operator_name = op.name
    except Exception:
        pass
    return {
        "id": str(s.id),
        "name": s.name,
        "operator_id": str(s.operator_id),
        "operator_name": operator_name,
        "province": s.province,
        "minerals": s.minerals,
        "price_per_person": s.price_per_person,
        "site_type": s.site_type,
        "is_active": s.is_active,
        "rating": s.rating,
        "review_count": s.review_count,
        "created_at": s.created_at.isoformat(),
    }


@router.get("/sites")
async def admin_list_sites(
    active: bool | None = None,
    skip: int = 0,
    limit: int = 100,
    _: None = Depends(require_admin_token),
) -> list[dict]:
    query: dict = {}
    if active is not None:
        query["is_active"] = active
    sites = await Site.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    return [await _site_dict(s) for s in sites]


class SiteStatusIn(BaseModel):
    is_active: bool


@router.patch("/sites/{site_id}/status")
async def admin_set_site_status(
    site_id: str,
    body: SiteStatusIn,
    _: None = Depends(require_admin_token),
) -> dict:
    try:
        site = await Site.get(PydanticObjectId(site_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Site not found")
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    site.is_active = body.is_active
    await site.save()
    return {"ok": True, "is_active": site.is_active}


# ── Bookings (all) ────────────────────────────────────────────────────────────

async def _booking_dict(b: Booking) -> dict:
    visitor_name, site_name = "", ""
    try:
        visitor = await User.get(b.visitor_id)
        if visitor:
            visitor_name = visitor.name
    except Exception:
        pass
    try:
        site = await Site.get(b.site_id)
        if site:
            site_name = site.name
    except Exception:
        pass
    return {
        "id": str(b.id),
        "site_id": str(b.site_id),
        "site_name": site_name,
        "visitor_id": str(b.visitor_id),
        "visitor_name": visitor_name,
        "date": b.date.isoformat(),
        "party_size": b.party_size,
        "total_amount": b.total_amount,
        "platform_fee": b.platform_fee,
        "operator_payout": b.operator_payout,
        "status": b.status,
        "is_group_booking": b.is_group_booking,
        "created_at": b.created_at.isoformat(),
    }


@router.get("/bookings")
async def admin_list_bookings(
    status: str | None = None,
    skip: int = 0,
    limit: int = 100,
    _: None = Depends(require_admin_token),
) -> list[dict]:
    query: dict = {}
    if status:
        query["status"] = status
    bookings = await Booking.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    return [await _booking_dict(b) for b in bookings]


class BookingStatusIn(BaseModel):
    status: str


@router.patch("/bookings/{booking_id}/status")
async def admin_set_booking_status(
    booking_id: str,
    body: BookingStatusIn,
    _: None = Depends(require_admin_token),
) -> dict:
    try:
        booking = await Booking.get(PydanticObjectId(booking_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Booking not found")
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    try:
        booking.status = BookingStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")
    await booking.save()
    return {"ok": True, "status": booking.status}


# ── Revenue ───────────────────────────────────────────────────────────────────

@router.get("/revenue")
async def admin_revenue(
    _: None = Depends(require_admin_token),
) -> dict:
    bookings = await Booking.find({"status": {"$in": ["confirmed", "completed"]}}).to_list()
    orders = await ShopOrder.find({"status": {"$ne": ShopOrderStatus.CANCELLED}}).to_list()
    subs = await StrataSubscription.find({"status": {"$ne": StrataStatus.CANCELLED}}).to_list()

    booking_gmv = sum(b.total_amount for b in bookings)
    booking_fee = sum(b.platform_fee for b in bookings)
    order_gmv = sum(o.total / 100 for o in orders)
    active_subs = sum(1 for s in subs if s.status == StrataStatus.ACTIVE)
    sub_mrr = 0.0
    for s in subs:
        if s.status != StrataStatus.ACTIVE:
            continue
        from app.models.strata import TIER_MONTHLY_CENTS
        sub_mrr += TIER_MONTHLY_CENTS.get(s.tier, 0) / 100

    # Bookings by month (last 6 months of completed/confirmed)
    from collections import defaultdict
    monthly: dict[str, dict] = defaultdict(
        lambda: {"bookings_gmv": 0.0, "fee": 0.0, "orders_gmv": 0.0}
    )
    for b in bookings:
        key = b.created_at.strftime("%Y-%m")
        monthly[key]["bookings_gmv"] += b.total_amount
        monthly[key]["fee"] += b.platform_fee
    for o in orders:
        key = o.created_at.strftime("%Y-%m")
        monthly[key]["orders_gmv"] += o.total / 100

    sorted_monthly = [{"month": k, **v} for k, v in sorted(monthly.items())[-6:]]

    return {
        "booking_gmv": round(booking_gmv, 2),
        "booking_fee_revenue": round(booking_fee, 2),
        "order_gmv": round(order_gmv, 2),
        "active_subscriptions": active_subs,
        "subscription_mrr": round(sub_mrr, 2),
        "total_bookings": len(bookings),
        "total_orders": len(orders),
        "monthly": sorted_monthly,
    }


# ── Expert applications ───────────────────────────────────────────────────────

def _expert_application_dict(u: User) -> dict:
    return {
        "id": str(u.id),
        "name": u.name,
        "email": u.email,
        "credential_type": u.credential_type,
        "credential_reference": u.credential_reference,
        "expert_specialisations": u.expert_specialisations,
        "institutional_affiliation": u.institutional_affiliation,
        "years_experience": u.years_experience,
        "bio": u.bio,
        "expert_tier": u.expert_tier,
        "created_at": u.created_at.isoformat(),
    }


@router.get("/expert/applications")
async def admin_expert_applications(
    _: None = Depends(require_admin_token),
) -> list[dict]:
    pending = await User.find(
        {"credential_type": {"$ne": None}, "expert_tier": None}
    ).sort("-created_at").to_list()
    return [_expert_application_dict(u) for u in pending]


class ExpertApprovalIn(BaseModel):
    tier: str   # verified_expert | community_reviewer | ogs_endorsed
    reject: bool = False


@router.patch("/expert/applications/{user_id}")
async def admin_review_expert_application(
    user_id: str,
    body: ExpertApprovalIn,
    _: None = Depends(require_admin_token),
) -> dict:
    try:
        user = await User.get(PydanticObjectId(user_id))
    except Exception:
        raise HTTPException(404, "User not found")
    if not user:
        raise HTTPException(404, "User not found")

    if body.reject:
        await user.set({
            "credential_type": None,
            "credential_reference": None,
            "expert_tier": None,
        })
        return {"ok": True, "action": "rejected"}

    valid_tiers = {"verified_expert", "community_reviewer", "ogs_endorsed"}
    if body.tier not in valid_tiers:
        raise HTTPException(400, f"Invalid tier: {body.tier}")

    await user.set({"expert_tier": body.tier})
    return {"ok": True, "action": "approved", "tier": body.tier}


# ── Creator applications ───────────────────────────────────────────────────────

def _creator_application_dict(u: User) -> dict:
    return {
        "id": str(u.id),
        "name": u.name,
        "email": u.email,
        "creator_application_handle": u.creator_application_handle,
        "creator_application_platform": u.creator_application_platform,
        "creator_application_short_answer": u.creator_application_short_answer,
        "creator_application_at": u.creator_application_at.isoformat() if u.creator_application_at else None,
        "bio": u.bio,
        "content_url": u.content_url,
    }


@router.get("/creator/applications")
async def admin_creator_applications(
    _: None = Depends(require_admin_token),
) -> list[dict]:
    pending = await User.find(
        {"creator_application_submitted": True, "is_creator": False}
    ).sort("-creator_application_at").to_list()
    return [_creator_application_dict(u) for u in pending]


class CreatorApprovalIn(BaseModel):
    tier: str   # explorer | field_geologist | resident_geologist
    reject: bool = False


@router.patch("/creator/applications/{user_id}")
async def admin_review_creator_application(
    user_id: str,
    body: CreatorApprovalIn,
    _: None = Depends(require_admin_token),
) -> dict:
    try:
        user = await User.get(PydanticObjectId(user_id))
    except Exception:
        raise HTTPException(404, "User not found")
    if not user:
        raise HTTPException(404, "User not found")

    if body.reject:
        await user.set({
            "creator_application_submitted": False,
            "creator_application_handle": None,
            "creator_application_platform": None,
            "creator_application_short_answer": None,
        })
        return {"ok": True, "action": "rejected"}

    valid_tiers = {"explorer", "field_geologist", "resident_geologist"}
    if body.tier not in valid_tiers:
        raise HTTPException(400, f"Invalid tier: {body.tier}")

    updates: dict = {
        "is_creator": True,
        "creator_tier": body.tier,
        "creator_application_submitted": False,
    }
    # Populate social field from application handle + platform
    platform = user.creator_application_platform
    handle = user.creator_application_handle or ""
    if platform == "instagram" and not user.social_instagram:
        updates["social_instagram"] = handle
    elif platform == "tiktok" and not user.social_tiktok:
        updates["social_tiktok"] = handle
    elif platform == "youtube" and not user.social_youtube:
        updates["social_youtube"] = handle

    await user.set(updates)

    # Add 'creator' to additive roles[] if not already present
    if "creator" not in user.roles:
        await user.set({"roles": user.roles + ["creator"]})

    return {"ok": True, "action": "approved", "tier": body.tier}
