from datetime import date

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import require_operator
from app.models.user import User
from app.models.weather_alert import WeatherAlert

router = APIRouter()


class WeatherAlertCreate(BaseModel):
    site_id: str
    message: str
    affected_dates: list[date] = []


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_weather_alert(
    body: WeatherAlertCreate,
    operator: User = Depends(require_operator),
) -> dict:
    alert = WeatherAlert(
        site_id=PydanticObjectId(body.site_id),
        operator_id=operator.id,
        message=body.message,
        affected_dates=body.affected_dates,
    )
    await alert.insert()
    return _alert_dict(alert)


@router.get("/site/{site_id}")
async def get_site_alerts(site_id: str) -> list[dict]:
    alerts = await WeatherAlert.find(
        WeatherAlert.site_id == PydanticObjectId(site_id),
        WeatherAlert.is_active == True,  # noqa: E712 — Beanie ODM query syntax requires ==
    ).sort(-WeatherAlert.created_at).to_list()
    return [_alert_dict(a) for a in alerts]


@router.get("/my")
async def my_alerts(operator: User = Depends(require_operator)) -> list[dict]:
    alerts = await WeatherAlert.find(
        WeatherAlert.operator_id == operator.id
    ).sort(-WeatherAlert.created_at).to_list()
    return [_alert_dict(a) for a in alerts]


@router.patch("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: PydanticObjectId,
    operator: User = Depends(require_operator),
) -> dict:
    alert = await WeatherAlert.get(alert_id)
    if not alert or alert.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Alert not found")
    await alert.set({WeatherAlert.is_active: False})
    return {"status": "resolved"}


def _alert_dict(a: WeatherAlert) -> dict:
    return {
        "id": str(a.id),
        "site_id": str(a.site_id),
        "message": a.message,
        "affected_dates": [d.isoformat() for d in a.affected_dates],
        "is_active": a.is_active,
        "created_at": a.created_at.isoformat(),
    }
