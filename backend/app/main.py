from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.deps import get_current_user
from app.api.routes import auth, availability, bookings, guide_bookings, guides, passport, payments, sites, weather_alerts, yield_reports
from app.core.config import settings
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


@app.get("/api/auth/me", tags=["auth"])
async def me(user: User = Depends(get_current_user)) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "stripe_account_id": user.stripe_account_id,
    }


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
