from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.deps import get_current_user
from app.api.routes import (
    admin,
    alert_subscriptions,
    auth,
    availability,
    bookings,
    diary,
    field_guides,
    finds,
    guide_bookings,
    guide_reviews,
    guides,
    hunts,
    junior,
    mineral_id,
    partners,
    passport,
    payments,
    products,
    quiz,
    shop_orders,
    site_questions,
    sites,
    specimens,
    strata,
    uploads,
    waitlist,
    weather_alerts,
    yield_reports,
)
from app.api.routes import (
    map as map_routes,
)
from app.core.database import close_db, init_db
from app.models.user import User


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Digby.rocks API",
    description="Rockhound site booking marketplace for Ontario & Canada",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(sites.router, prefix="/api/sites", tags=["sites"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["bookings"])
app.include_router(availability.router, prefix="/api/availability", tags=["availability"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(guides.router, prefix="/api/guides", tags=["guides"])
app.include_router(guide_bookings.router, prefix="/api/guide-bookings", tags=["guide-bookings"])
app.include_router(yield_reports.router, prefix="/api/yield-reports", tags=["yield-reports"])
app.include_router(weather_alerts.router, prefix="/api/weather-alerts", tags=["weather-alerts"])
app.include_router(passport.router, prefix="/api/passport", tags=["passport"])
app.include_router(hunts.router, prefix="/api/hunts", tags=["hunts"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(diary.router, prefix="/api/diary", tags=["diary"])
app.include_router(finds.router, prefix="/api/finds", tags=["finds"])
app.include_router(partners.router, prefix="/api/partners", tags=["partners"])
app.include_router(guide_reviews.router, prefix="/api/guide-reviews", tags=["guide-reviews"])
app.include_router(mineral_id.router, prefix="/api/mineral-id", tags=["mineral-id"])
app.include_router(alert_subscriptions.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(specimens.router, prefix="/api/specimens", tags=["specimens"])
app.include_router(site_questions.router, prefix="/api/site-questions", tags=["site-questions"])
app.include_router(field_guides.router, prefix="/api/field-guides", tags=["field-guides"])
app.include_router(waitlist.router, prefix="/api/waitlist", tags=["waitlist"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(shop_orders.router, prefix="/api/shop/orders", tags=["shop-orders"])
app.include_router(junior.router, prefix="/api/junior", tags=["junior"])
app.include_router(strata.router, prefix="/api/strata", tags=["strata"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(map_routes.router, prefix="/api/map", tags=["map"])


@app.get("/api/auth/me", tags=["auth"])
async def me(user: User = Depends(get_current_user)) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "stripe_account_id": user.stripe_account_id,
        "stripe_account_enabled": user.stripe_account_enabled,
    }


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
