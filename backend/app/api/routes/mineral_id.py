import base64
import hashlib
import json
from collections import defaultdict
from datetime import UTC, datetime, timedelta

import httpx
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.core.config import settings
from app.core.security import decode_token

router = APIRouter()

# ── Rate limiting: 10 requests / 24 h per IP for unauthenticated users ───────
_rl: dict[str, list[datetime]] = defaultdict(list)


def _check_rate_limit(key: str) -> bool:
    now = datetime.now(UTC)
    cutoff = now - timedelta(hours=24)
    timestamps = [t for t in _rl[key] if t > cutoff]
    _rl[key] = timestamps
    if len(timestamps) >= 10:
        return False
    _rl[key].append(now)
    return True


# ── Result cache keyed on SHA-256 of images + context (1 h TTL) ──────────────
_cache: dict[str, tuple[dict, datetime]] = {}


def _cache_get(key: str) -> dict | None:
    if key not in _cache:
        return None
    result, expires = _cache[key]
    if datetime.now(UTC) < expires:
        return result
    del _cache[key]
    return None


def _cache_set(key: str, result: dict) -> None:
    _cache[key] = (result, datetime.now(UTC) + timedelta(hours=1))


# ── System prompt ─────────────────────────────────────────────────────────────
_SCHEMA = (
    '{\n'
    '  "identified_mineral": "string",\n'
    '  "confidence": "high" | "medium" | "low",\n'
    '  "confidence_reason": "string — one sentence",\n'
    '  "visual_clues": ["3-5 observable features that led to this identification"],\n'
    '  "formation_notes": "string — 2-3 sentences on geological formation",\n'
    '  "ontario_context": {\n'
    '    "province": "Grenville | Superior | Southern | Churchill | Widespread",\n'
    '    "typical_formations": ["1-3 Ontario formations or districts"],\n'
    '    "typical_localities": ["1-3 specific Ontario collecting localities"]\n'
    '  },\n'
    '  "physical_properties": {\n'
    '    "hardness": "Mohs hardness",\n'
    '    "cleavage": "description or none",\n'
    '    "fracture": "fracture type",\n'
    '    "lustre": "lustre type",\n'
    '    "streak": "streak colour",\n'
    '    "specific_gravity": "SG range"\n'
    '  },\n'
    '  "specimen_quality": "string — collector value and display suggestion",\n'
    '  "uv_fluorescence": "string — shortwave/longwave behaviour or Not typically fluorescent",\n'
    '  "care_tips": "string — one sentence on cleaning, storage, display",\n'
    '  "rarity_notes": "string — how common at Ontario rockhounding sites",\n'
    '  "alternatives": [\n'
    '    {\n'
    '      "mineral": "string",\n'
    '      "reason": "why it could be confused with the primary ID",\n'
    '      "field_test": "practical test to distinguish — no lab equipment"\n'
    '    }\n'
    '  ]\n'
    '}'
)

_SYSTEM = (
    "You are a professional mineralogist specialising in Ontario and Canadian geology. "
    "You are helping rockhounds — amateur collectors who have dug specimens at pay-to-dig "
    "sites in Ontario. Be accurate, specific, and practical.\n\n"
    "Analyse the provided specimen photograph(s) and return a JSON object with EXACTLY "
    "this schema:\n\n"
    + _SCHEMA
    + "\n\nalternatives must contain 2-3 entries. "
    "Respond with ONLY the JSON object — no markdown fences, no preamble, no trailing text."
)

_UV_LABELS: dict[str, str] = {
    "fluoresces-sw": "Fluoresces under shortwave UV",
    "fluoresces-lw": "Fluoresces under longwave UV",
    "fluoresces-both": "Fluoresces under both shortwave and longwave UV",
    "no-fluorescence": "Does not fluoresce under UV",
}

_ACCEPTED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_FILE_BYTES = 5 * 1024 * 1024
_MAX_IMAGES = 4


def _build_user_content(
    images: list[tuple[str, str]],
    province: str,
    host_rock: str,
    uv_behavior: str,
    site_context: str,
) -> list[dict]:
    parts: list[dict] = []
    for media_type, b64 in images:
        parts.append({
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": b64},
        })

    ctx_parts = []
    if site_context:
        ctx_parts.append(f"Site: {site_context}")
    if province and province != "Unknown":
        ctx_parts.append(f"Geological province: {province}")
    if host_rock:
        ctx_parts.append(f"Host rock: {host_rock}")
    if uv_behavior and uv_behavior != "not-tested":
        label = _UV_LABELS.get(uv_behavior, uv_behavior)
        ctx_parts.append(f"UV behaviour: {label}")

    text = "Identify this mineral or rock specimen."
    if ctx_parts:
        text += " Context — " + "; ".join(ctx_parts) + "."
    parts.append({"type": "text", "text": text})
    return parts


@router.post("/")
async def identify_mineral(
    request: Request,
    files: list[UploadFile] = File(...),
    site_context: str = Form(""),
    province: str = Form("Unknown"),
    host_rock: str = Form(""),
    uv_behavior: str = Form("not-tested"),
) -> dict:
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="AI identification not configured")

    # Authenticated users bypass rate limit
    auth_header = request.headers.get("Authorization", "")
    is_authenticated = False
    if auth_header.startswith("Bearer "):
        try:
            decode_token(auth_header.removeprefix("Bearer ").strip())
            is_authenticated = True
        except ValueError:
            pass

    if not is_authenticated:
        client_ip = request.client.host if request.client else "unknown"
        if not _check_rate_limit(client_ip):
            raise HTTPException(
                status_code=429,
                detail="10 identifications per day for guests — sign in for unlimited access",
            )

    if not files:
        raise HTTPException(status_code=422, detail="At least one image is required")
    if len(files) > _MAX_IMAGES:
        raise HTTPException(status_code=422, detail=f"Maximum {_MAX_IMAGES} images per request")

    image_data: list[tuple[str, bytes]] = []
    for f in files:
        data = await f.read()
        if len(data) > _MAX_FILE_BYTES:
            raise HTTPException(status_code=413, detail="Image too large (max 5 MB each)")
        media_type = f.content_type or "image/jpeg"
        if media_type in ("image/heic", "image/heif"):
            raise HTTPException(
                status_code=415,
                detail="HEIC not supported — export as JPEG from your camera roll",
            )
        if media_type not in _ACCEPTED_TYPES:
            media_type = "image/jpeg"
        image_data.append((media_type, data))

    # Cache lookup
    ctx_str = f"{province}|{host_rock}|{uv_behavior}|{site_context}"
    cache_input = b"".join(d for _, d in image_data) + ctx_str.encode()
    cache_key = hashlib.sha256(cache_input).hexdigest()
    if cached := _cache_get(cache_key):
        return cached

    images_b64 = [(mt, base64.standard_b64encode(d).decode()) for mt, d in image_data]
    user_content = _build_user_content(images_b64, province, host_rock, uv_behavior, site_context)

    payload = {
        "model": "claude-sonnet-4-6",
        "max_tokens": 1024,
        "system": _SYSTEM,
        "messages": [{"role": "user", "content": user_content}],
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
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

    raw = resp.json()["content"][0]["text"]
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Could not parse AI response")

    _cache_set(cache_key, result)
    return result
