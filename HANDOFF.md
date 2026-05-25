# Digby — Last Session Summary

**Date:** 2026-05-25

## What shipped

- **CI fixes**: mypy 47 errors + ESLint 10 errors resolved. App was crashing on Railway due to `Indexed[str]` runtime bug — fixed to `Indexed(str)`. Backend type-check and frontend lint now clean.
- **Operator Dashboard** (`/dashboard`): 3-state rendering (setup checklist vs. live dashboard). New `GET /api/availability/operator` endpoint replaces N per-site fetches.
- **Guide Dashboard** (`/dashboard/guide`): Full rewrite with 3 states (incomplete → pending verification → verified). `/api/auth/me` now returns guide fields. `GET /api/guides/me` added (was only PATCH — old page was broken). New `/dashboard/guide/edit` page.
- **Prospector Track** (`/learn`): Third learn track with 7 lessons on Ontario mineral rights, MLAS map, cell staking, ground truthing, historical occurrences, private landowners. Lesson 8 held pending Princess Sodalite Mine terms. Amber colour theme, Pickaxe icon, learn page updated to 3-column grid.

## Pending

- Stripe webhook secret mismatch suspected on Railway — verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- OGS data-sharing: Robin needs to contact Resident Geologist, confirm format, sign MOU
- Prospector Track lesson 8 (Sourcing Specimens) — held until Princess Sodalite Mine terms confirmed
- Digby geology map popups reference MDI numbers — should eventually update to OMI (low priority)

## Key files touched this session

- `backend/app/main.py` — auth/me returns guide fields
- `backend/app/api/routes/guides.py` — GET /me added, is_verified/is_active in dict
- `backend/app/api/routes/availability.py` — GET /operator endpoint
- `frontend/lib/types.ts` — User type extended with guide fields
- `frontend/lib/learn-content.ts` — prospector track added
- `frontend/app/(site)/dashboard/page.tsx` — operator 3-state dashboard
- `frontend/app/(site)/dashboard/guide/page.tsx` — guide 3-state dashboard
- `frontend/app/(site)/dashboard/guide/edit/page.tsx` — new
- `frontend/app/(site)/learn/page.tsx` — 3-column, amber, Pickaxe
- `frontend/app/(site)/learn/[track]/[lesson]/page.tsx` — amber colour variant
