import base64
import json

import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import settings

router = APIRouter()

_SYSTEM = """You are a professional mineralogist with expertise in Ontario and Canadian geology.
Analyze the rock or mineral specimen photograph and return a JSON object with exactly these fields:
- identified_mineral: the most likely mineral or rock name (string)
- confidence: "high", "medium", or "low"
- formation_notes: 1-2 sentences on how this mineral typically forms
- rarity_notes: how common or rare this specimen is at Ontario rockhounding sites
- care_tips: one sentence on cleaning, storage, or display
- alternative_minerals: array of 1-2 other possible identifications (strings)

Respond with ONLY the JSON object. No markdown fences, no extra text."""


@router.post("/")
async def identify_mineral(
    file: UploadFile = File(...),
    site_context: str = Form(""),
) -> dict:
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="AI identification not configured")

    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 5 MB)")

    media_type = file.content_type or "image/jpeg"
    if media_type not in ("image/jpeg", "image/png", "image/webp", "image/gif"):
        media_type = "image/jpeg"

    b64 = base64.standard_b64encode(data).decode()

    user_text = "Identify this mineral or rock specimen."
    if site_context:
        user_text += f" Site context: {site_context}"

    payload = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 512,
        "system": _SYSTEM,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": media_type, "data": b64},
                    },
                    {"type": "text", "text": user_text},
                ],
            }
        ],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json=payload,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="AI service error")

    content = resp.json()["content"][0]["text"]
    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Could not parse AI response")

    return result
