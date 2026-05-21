# Digby — Claude Code Guide

## What This App Is

**Digby.rocks** is a marketplace for rockhound site access in Ontario, Canada. Operators (landowners) list pay-to-dig mineral sites; visitors discover, book, and pay for access. Think Airbnb for rockhounds.

Core features: site discovery via map, date-based booking, Stripe payments (12% platform fee / 88% operator), guided tours, passport stamps (gamification), weather alerts, yield reports.

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.12, FastAPI, Beanie (MongoDB ODM), Motor |
| Frontend | Next.js 15, React 19, TypeScript 5.7, Tailwind CSS 3.4 |
| Database | MongoDB Atlas (cloud), MongoDB 7 (local dev via Docker) |
| Auth | JWT (HS256, 7-day tokens), bcrypt passwords |
| Payments | Stripe Connect Express (operator payouts) |
| Maps | Mapbox GL (react-map-gl) |
| State | Zustand (client), TanStack React Query (server) |
| Deployment | Docker + Railway |

## Project Structure

```
digby/
  backend/
    app/
      main.py           # FastAPI app, route registration, lifespan
      core/
        config.py       # pydantic-settings (reads .env)
        database.py     # MongoDB init, Beanie setup
        security.py     # bcrypt, JWT sign/verify
      api/
        deps.py         # get_current_user, require_operator
        routes/         # auth, sites, bookings, availability, payments,
                        # guides, guide_bookings, yield_reports,
                        # weather_alerts, passport
      models/           # Beanie documents: User, Site, Booking,
                        # Availability, Review, GuideBooking,
                        # PassportStamp, WeatherAlert, YieldReport
  frontend/
    app/
      (auth)/           # Login, register
      sites/            # Discovery (map + list), site detail
      bookings/         # My bookings, confirmation
      dashboard/        # Operator portal
      guides/           # Browse guides, profiles
      passport/         # Visitor passport + badges
    components/         # Navbar, Map, BookingForm, SiteCard
    lib/
      api.ts            # HTTP client
      auth.ts           # JWT helpers
      types.ts          # TypeScript interfaces
  openspec/             # Spec-driven development (see below)
  docker-compose.yml    # Backend + frontend + MongoDB
  .env.example          # Environment variable template
```

## Running Locally

```bash
# With Docker (recommended)
cp .env.example .env    # fill in secrets
docker compose up

# Backend: http://localhost:8001  |  API docs: http://localhost:8001/docs
# Frontend: http://localhost:3000
# MongoDB:  localhost:27017
```

```bash
# Without Docker
cd backend && uv sync && uv run uvicorn app.main:app --reload   # :8000
cd frontend && npm install && npm run dev                        # :3000
```

## Development Commands

**Backend** (run from `backend/`):
```bash
uv run ruff check .                        # lint
uv run mypy app --ignore-missing-imports   # type check
uv run pytest tests/ -v                    # tests (tests/ dir TBD)
```

**Frontend** (run from `frontend/`):
```bash
npm run type-check   # tsc
npm run lint         # ESLint
npm run build        # production build
```

## Key Conventions

- **Roles**: `VISITOR`, `OPERATOR`, `GUIDE`, `ADMIN` — enforced via `require_operator` dep
- **No SQL migrations** — Beanie auto-creates MongoDB indexes on startup
- **Stripe webhook** must be verified via `STRIPE_WEBHOOK_SECRET` before processing
- **CORS** controlled by `BACKEND_CORS_ORIGINS` env var (comma-separated)
- **Platform fee** is `STRIPE_PLATFORM_FEE_PERCENT` (default 12%)
- Backend line length: 100 chars (ruff config)

## Environment Variables

See `.env.example`. Key vars:
- `MONGODB_URL` — Atlas connection string
- `JWT_SECRET` — 64-char hex string
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PLATFORM_FEE_PERCENT`
- `NEXT_PUBLIC_API_URL` — backend URL for frontend
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## OpenSpec — Spec-Driven Development

This project uses OpenSpec for persistent context across sessions.

**Before starting any implementation task:**
1. Check `openspec/changes/` for an active proposal matching the task
2. If found, read `design.md` and `tasks.md` before touching code
3. Read the relevant `openspec/specs/` file for the capability being changed
4. Update `tasks.md` checkboxes as each item is completed (`[ ]` → `[x]`)

**Evergreen specs** (source of truth per capability):
- [openspec/specs/auth.md](openspec/specs/auth.md) — JWT auth, roles, user model
- [openspec/specs/bookings.md](openspec/specs/bookings.md) — booking lifecycle, group bookings
- [openspec/specs/payments.md](openspec/specs/payments.md) — Stripe Connect, webhooks, fee split
- [openspec/specs/sites.md](openspec/specs/sites.md) — site model, geospatial search, discovery
- [openspec/specs/passport.md](openspec/specs/passport.md) — stamps, badges, yield reports

**Starting a new feature:**
Create `openspec/changes/FEATURE_NAME/` with `proposal.md`, `design.md`, `tasks.md`, `delta-spec.md`.
See [openspec/README.md](openspec/README.md) for the full workflow.
