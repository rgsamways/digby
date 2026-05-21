import logging
import smtplib
from datetime import UTC, datetime
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.alert_subscription import AlertSubscription
from app.models.site import Site
from app.models.user import User, UserRole

router = APIRouter()
logger = logging.getLogger(__name__)


class SubscribeBody(BaseModel):
    minerals: list[str] = []
    provinces: list[str] = []


def _sub_dict(s: AlertSubscription) -> dict:
    return {
        "id": str(s.id),
        "email": s.email,
        "minerals": s.minerals,
        "provinces": s.provinces,
        "is_active": s.is_active,
        "created_at": s.created_at.isoformat(),
    }


@router.post("/subscribe")
async def subscribe(
    body: SubscribeBody,
    user: User = Depends(get_current_user),
) -> dict:
    existing = await AlertSubscription.find_one(
        AlertSubscription.visitor_id == str(user.id),
        AlertSubscription.is_active == True,  # noqa: E712
    )
    if existing:
        await existing.set({
            "minerals": body.minerals,
            "provinces": body.provinces,
        })
        await existing.sync()
        return _sub_dict(existing)

    sub = AlertSubscription(
        visitor_id=str(user.id),
        email=user.email,
        minerals=body.minerals,
        provinces=body.provinces,
    )
    await sub.insert()
    return _sub_dict(sub)


@router.get("/my")
async def my_subscription(user: User = Depends(get_current_user)) -> dict | None:
    sub = await AlertSubscription.find_one(
        AlertSubscription.visitor_id == str(user.id),
        AlertSubscription.is_active == True,  # noqa: E712
    )
    return _sub_dict(sub) if sub else None


@router.delete("/my")
async def unsubscribe(user: User = Depends(get_current_user)) -> dict:
    sub = await AlertSubscription.find_one(
        AlertSubscription.visitor_id == str(user.id),
    )
    if sub:
        await sub.set({"is_active": False})
    return {"unsubscribed": True}


@router.post("/dispatch")
async def dispatch_alerts(user: User = Depends(get_current_user)) -> dict:
    """Find active seasonal windows for the current month and email matching subscribers."""
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    now = datetime.now(UTC)
    month = now.month

    sites = await Site.find(Site.is_active == True).to_list()  # noqa: E712
    active_windows: list[dict] = []
    for site in sites:
        for w in site.seasonal_windows:
            in_window = (
                (w.start_month <= w.end_month and w.start_month <= month <= w.end_month)
                or (w.start_month > w.end_month and (month >= w.start_month or month <= w.end_month))  # noqa: E501
            )
            if in_window:
                active_windows.append({"site": site, "window": w})

    if not active_windows:
        return {"sent": 0, "message": "No active seasonal windows this month"}

    subs = await AlertSubscription.find(AlertSubscription.is_active == True).to_list()  # noqa: E712

    sent = 0
    for sub in subs:
        matching = [
            aw for aw in active_windows
            if (not sub.minerals or aw["window"].mineral in sub.minerals)
            and (not sub.provinces or aw["site"].province in sub.provinces)
        ]
        if not matching:
            continue

        lines = ["Hi! These sites are in season now:\n"]
        for aw in matching:
            lines.append(
                f"• {aw['site'].name} — {aw['window'].mineral}"
                + (f" ({aw['window'].notes})" if aw['window'].notes else "")
            )
        lines.append("\nBook at https://digby.rocks/sites")
        body_text = "\n".join(lines)

        _send_email(sub.email, "Digby: Your minerals are in season!", body_text)
        sent += 1

    return {"sent": sent}


def _send_email(to: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        logger.info("SMTP not configured — would send to %s: %s", to, subject)
        return
    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as s:
            s.starttls()
            if settings.SMTP_USER:
                s.login(settings.SMTP_USER, settings.SMTP_PASS)
            s.send_message(msg)
    except Exception:
        logger.exception("Failed to send email to %s", to)
