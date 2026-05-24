# Digby.rocks — Complete Project Handoff
_Last updated May 24, 2026 by Claude Code from direct code inspection. This document reflects the actual state of the codebase, not the todo list (which is outdated in several places)._

---

## What Is Digby

**digby.rocks** is a marketplace for rockhound site access in Ontario, Canada. Operators list pay-to-dig mineral sites; visitors book and pay for access. Think Airbnb for rockhounds.

- **Platform fee:** 12% to Digby, 88% to operator (Stripe Connect Express)
- **Deployed on:** Railway (backend + frontend containers)
- **Backend:** Python 3.12 · FastAPI · Beanie ODM · MongoDB Atlas
- **Frontend:** Next.js 15 · React 19 · TypeScript 5.7 · Tailwind CSS 3.4
- **Auth:** JWT HS256 · 7-day tokens · bcrypt passwords
- **Storage:** AWS S3 bucket `digby-uploads-327205296256`, region `ca-central-1`
- **Maps:** Mapbox GL (react-map-gl)
- **State:** Zustand (client) · TanStack Query (server)

**User roles:** `visitor`, `operator`, `guide`, `admin`

---

## Repository Layout

```
digby/
  backend/app/
    main.py              FastAPI app, route registration, lifespan + auto-seed
    core/
      config.py          pydantic-settings (.env)
      database.py        MongoDB init, all Beanie document models listed here
      security.py        bcrypt, JWT sign/verify
    api/
      deps.py            get_current_user, require_operator, require_admin_token
      routes/            one file per feature (see list below)
    models/              Beanie documents, one file per domain
  frontend/
    app/                 Next.js App Router pages
    components/          Navbar, etc.
    lib/
      api.ts             HTTP client wrapper
      auth.ts            JWT helpers, useAuthStore (Zustand)
      junior.ts          Junior Club API + TypeScript interfaces
      cart.ts            Cart store (Zustand + localStorage)
  openspec/
    specs/digby-todo.md  Master task list (NOTE: several items marked [ ] are actually done)
```

---

## Feature Status (verified against actual code)

---

### Auth & Users ✅

- Register, login, JWT issuance (`/api/auth/register`, `/api/auth/login`)
- `GET /api/auth/me` — returns `{id, email, name, role, stripe_account_id, stripe_account_enabled}`
- User model: `email`, `name`, `phone`, `role`, `bio`, `avatar_url`, `stripe_customer_id` (visitor), `stripe_account_id` + `stripe_account_enabled` (operator), `specialties[]`, `years_experience`, `certifications[]`, `rate_per_day`, `guide_location`, `is_verified`, `is_active`
- Frontend: `/login`, `/register`

---

### Sites & Availability ✅

- Site CRUD (`/api/sites`), availability management (`/api/availability`)
- Operator dashboard at `/dashboard/sites` — create/edit sites
- Site discovery at `/sites` (list) and `/map` (map)
- Site detail at `/sites/[id]`

---

### Bookings ✅

Routes at `/api/bookings/`:
- `POST /` — create booking with Stripe PaymentIntent (CAD, Connect Express, 12% platform fee)
- `POST /mystery` — random site picker by province + mineral preference
- `GET /my` — visitor's bookings
- `GET /operator` — operator's bookings
- `PATCH /{id}/cancel` — cancels PaymentIntent + notifies first waitlist entry via email
- `PATCH /{id}/members` — update group members
- `PATCH /{id}/complete` — marks booking completed, auto-creates passport stamp, triggers junior badge award for all junior profiles under the visitor

Frontend: `/bookings` (my bookings), `/mystery` (mystery dig form), `/bookings/[id]/confirm`

**Group bookings:** `is_group_booking` flag + `group_members: [{name, age, notes}]` list on Booking model.

---

### Payments / Stripe Webhooks ✅

Route file: `payments.py`
- `POST /api/payments/connect/onboard` — Stripe Connect Express onboarding link for operators
- `POST /api/payments/webhook` — verified with `STRIPE_WEBHOOK_SECRET`

Webhook handlers (all implemented):
- `payment_intent.succeeded` → confirm booking OR specimen order OR shop order (routing by `order_type` metadata)
- `payment_intent.payment_failed` → cancel booking or specimen order, restore specimen stock
- `invoice.payment_succeeded` → activate Strata subscription, update period end
- `invoice.payment_failed` → set Strata subscription to `past_due`
- `customer.subscription.deleted` → cancel Strata subscription
- `account.updated` → update operator `stripe_account_enabled`

---

### Visitor Passport ✅

Route: `/api/passport/`
- `GET /me` — stamps, points, badges, hunt completions, quiz sessions, diary entries
- `GET /leaderboard` — top 10 by points
- `GET /{visitor_id}` — public passport view
- `POST /stamp` — manually add stamp (idempotent by booking_id)

Stamps are **auto-created** in `bookings.py` when `PATCH /{id}/complete` is called.

Passport badges (adult, not junior):
- `first_dig` (1 visit), `rock_hound` (5), `gem_hunter` (10), `mineral_master` (25)

Points: 25/stamp + 10/unique mineral + 100/hunt + quiz points + diary points

Frontend: `/passport` (my passport), `/passport/[id]` (public view)

---

### Geology Map ✅ Fully complete

Route: `GET /api/map/sites` → GeoJSON FeatureCollection of all active Digby sites

Frontend: `/map` — full-screen Mapbox map, collapsible sidebar, mobile bottom drawer

**Layers:**
| Layer | Source | Status |
|---|---|---|
| Bedrock geology | Local GeoJSON `/geodata/bedrock.geojson` (served from `/public`) | ✅ Active |
| Mineral occurrences (OMI) | Local GeoJSON `/geodata/omi.geojson` (served from `/public`) | ✅ Active |
| Digby sites | GeoJSON from `/api/map/sites` | ✅ Active |
| Past producing mines | Filtered from OMI by `STATUS` field | ✅ Active |

**No Mapbox tilesets required.** The OGS shapefiles (MRD126 Geopoly + OMI) were converted to GeoJSON using a one-time Python script (`convert_shapefiles.py`, project root). Douglas-Peucker simplification (ε=0.05), 4-decimal coordinate precision, unused fields stripped. Final sizes: bedrock 15 MB, OMI 4 MB. Next.js gzips static files in production (~2-3 MB over the wire).

**Field names hardcoded in map page:**
- Bedrock: `PROVINCE_P`, `UNITNAME_P`, `ERA_P`, `ROCKTYPE_P`
- OMI: `NAME`, `STATUS`, `P_COMMOD`, `MDI_IDENT`

All four layers are fully active in production. No tileset env vars needed.

---

### AI Mineral Identifier ✅

Route: `POST /api/mineral-id/`

- Up to 4 images, canvas-compressed client-side (max 1200px, JPEG@85, EXIF stripped)
- Optional context: province, host rock, UV behaviour, site context
- Uses `claude-sonnet-4-6` vision via direct Anthropic API (httpx, not SDK)
- Returns: `identified_mineral`, `confidence` (high/medium/low), `confidence_reason`, `visual_clues[]`, `formation_notes`, `ontario_context` (province, formations, localities), `physical_properties` (hardness, cleavage, fracture, lustre, streak, SG), `specimen_quality`, `uv_fluorescence`, `care_tips`, `rarity_notes`, `alternatives[]` (2-3, each with `mineral`, `reason`, `field_test`)
- Rate limiting: 10/day per IP unauthenticated; authenticated users exempt (checks JWT in header)
- Result cache: 1h TTL keyed on SHA-256(all image bytes + context string)
- HEIC rejected with 415 — deferred (needs system libheif)
- One-tap "Log to Find Journal" is wired: pre-populates `/finds/new?mineral=X&notes=Y&host_rock=Z&province=P&verification=ai_likely` via query params

---

### File Upload / S3 ✅

Route: `POST /api/uploads/images` (requires auth)

- boto3, bucket `digby-uploads-327205296256`, region `ca-central-1`
- Accepts: JPEG, PNG, WebP, GIF; max 10 MB each; up to 8 files per request
- Returns: `{"urls": ["https://digby-uploads-327205296256.s3.ca-central-1.amazonaws.com/uploads/{user_id}/{uuid}.jpg", ...]}`
- Bucket has public GetObject policy — URLs are directly embeddable
- Used by: **Find Journal** (find form calls this before creating the find), **Product admin** (URL input for now, not upload)

---

### Find Journal + Citizen Science ✅ (fully working including S3)

Routes at `/api/finds/`:
- `POST /` — create find
- `GET /my` — user's finds (all, sorted by date)
- `GET /feed` — public feed (filterable: mineral, province, verification, featured_only; paginated)
- `GET /feed/saved` — user's saved finds
- `GET /{id}` — single find (SSR-compatible, privacy enforced)
- `PATCH /{id}` + `DELETE /{id}` — edit/delete (owner only)
- `POST /{id}/save` — toggle save/bookmark
- `GET /admin/export` — CSV of all citizen-science-eligible finds (requires admin token)

**Find model fields:** user_id, date, mineral_name, notes, photo_urls[], gps_lat, gps_lng, site_id, site_name, host_rock, geological_province, formation, specimen_quality, verification_status (unverified/ai_likely/community_verified/ogs_reviewed/disputed), citizen_science_opted_in, citizen_science_eligible (computed), visibility (public/private), save_count, is_featured, is_junior_submission, uv_fluorescence (green/blue/red/orange/white/multi/null), is_haul (bool)

**Citizen science eligibility** is auto-computed on save: requires GPS + at least one photo + verification ≥ ai_likely + host_rock + opted_in.

**Photo upload to S3 IS wired** in the find form — the `/finds/new` page calls `/api/uploads/images` before creating the find, then passes the returned URLs in `photo_urls`. The todo list item saying this is pending is **wrong**.

Frontend: `/finds` (public feed), `/finds/my` (private journal), `/finds/new` (log form — wrapped in `<Suspense>` for Next.js 15), `/finds/[id]` (SSR, 60s revalidation)

**Known gap:** Formation auto-population from GPS (would look up the bedrock layer to fill in the formation field automatically). Not implemented — blocked until OGS tileset query API is available.

---

### Shop ✅

Routes: `/api/products/` + `/api/shop/orders/`
- `GET /api/products` — list (filter by category, subcategory, tag, site_slug; paginated)
- `GET /api/products/{id}` — detail + up to 4 related products
- `POST /api/shop/orders/intent` — validate cart, check stock, Stripe PaymentIntent (CAD)
- `GET /api/shop/orders/my` + `GET /api/shop/orders/{id}` — order history/detail
- Webhook in `payments.py` handles `payment_intent.succeeded` (order_type=shop): idempotency check, decrements stock, inserts ShopOrder

Frontend: `/shop` (listing with category tabs), `/shop/[slug]` (product detail), `/shop/cart` (cart, Zustand + localStorage, guest-friendly), `/shop/orders` (order history)

Checkout flow: cart → address → Stripe PaymentElement → confirmation

**Two open decisions:**
- Image storage: product images are URL-input only in admin (S3 exists and works for finds/mineral-id; wiring to product admin form is not done)
- Shipping: $12.99 CAD flat rate placeholder. Canada Post API decision pending.

---

### Admin Panel ✅

Routes at `/admin` (requires `ADMIN_PASSWORD` env var, issues JWT with role=admin):

**Shop:**
- Products: list, create, edit (all fields including slug, category, subcategory, price, cost, SKU, supplier, stock, dropship, active, tags, related_products, site_recommendations)
- Orders: list, detail, manual status update (pending → confirmed → fulfilled → shipped → cancelled)
- Soft delete (active: false)

**Platform management (v2):**
- Users: list all users, role/status display
- Sites: list all sites, operator + status display
- Bookings: list all bookings, status + payment info
- Revenue: revenue dashboard (total, by operator, by period)

**Strata:**
- Subscriber list (`/admin/strata`) — name, tier, status, renewal date, address
- Box fulfilment status (`/admin/strata/fulfilment`) — which subscribers received which box months
- Box archive editor (`/admin/strata/boxes`) — create/edit published box records

Frontend: `/admin/login`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/orders`, `/admin/orders/[id]`, `/admin/users`, `/admin/sites`, `/admin/bookings`, `/admin/revenue`, `/admin/strata`, `/admin/strata/boxes`, `/admin/strata/fulfilment`

---

### Digby Strata — Subscription Box ✅

Routes at `/api/strata/`:
- `POST /subscribe` — Stripe Billing recurring subscription (payment_behavior=default_incomplete), saves pending StrataSubscription record
- `GET /my` + `PATCH /my` + `DELETE /my` — subscriber portal (manage tier/address/pause/cancel-at-period-end)
- `POST /gift` — PaymentIntent for fixed-month gift
- `GET /boxes` + `GET /boxes/{month}` — published box archive
- `GET /redeem/{code}` — validate and redeem collector card code

Tiers: Discoverer $39/mo · Collector $59/mo · Geologist $89/mo (monthly or annual; annual = 10% off × 12)
Status states: `pending`, `active`, `paused`, `past_due`, `cancelled`
Webhooks: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted` — all handled in payments.py

Frontend: `/strata` (signup), `/strata/archive` (box history), `/strata/my` (subscriber portal with pause/cancel flows)

**Bancroft Gemboree deadline: August 1, 2026**

**Not started:**
- Shipping label CSV export (subscriber addresses → CSV for Canada Post)
- Collector card UTM tracking (bookings from Strata subscribers)

---

### GIS Education / Learn ✅

Frontend pages: `/learn` (track selector), `/learn/[track]/[lesson]`

Two tracks, 5 lessons each — all 10 lessons are fully written content:
- **Field Track** — 5-minute reads, no software: geology formation, four provinces, minerals at Digby sites, Crown land/mineral rights, planning a trip with the Digby map
- **GIS Track** — QGIS-based: installing QGIS, querying OGS data, symbolizing formations, intersecting layers, spatial trip planning

---

### Junior Geologist Games ✅ (all 6 games working; known gaps below)

**All content seeded automatically on every deploy** (idempotent, in `main.py` lifespan):
- 43 Ontario minerals
- 19 badges
- 20 detective cases

#### Database models (`backend/app/models/junior.py`)

| Document | Collection | Purpose |
|---|---|---|
| `JuniorProfile` | `junior_profiles` | linked to parent `User` via `parent_id` |
| `JuniorMineral` | `junior_minerals` | global content, 43 Ontario minerals |
| `JuniorCollection` | `junior_collection` | per (user_id, junior_id, mineral_id) — unique compound index |
| `Badge` | `badges` | 19 global badge definitions |
| `BadgeState` | `badge_states` | per (user_id, junior_id, badge_id) — unique compound index |
| `DetectiveCase` | `detective_cases` | 20 case definitions |
| `DetectiveCaseHistory` | `detective_case_history` | per (user_id, junior_id, case_id) — unique compound index |

JuniorMineral fields: `mineral_id` (slug), `name`, `family`, `rarity` (common/uncommon/rare/legendary), `mohs_hardness`, `key_property`, `ontario_locality`, `flavour_text`, `fun_fact`, `age_easy_description`, `age_standard_description`, `detective_clues[]`, `dig_site_associations[]`, `province_associations[]`, `card_emoji`, `card_colour`

Rarity weights for daily card draw: COMMON=60, UNCOMMON=25, RARE=13, LEGENDARY=2

#### API routes (`/api/junior/`)

| Route | Notes |
|---|---|
| `POST /profiles` | Create profile (max 4 per account) |
| `GET /profiles` | List profiles for logged-in user |
| `PATCH /profiles/{id}` | Update profile |
| `DELETE /profiles/{id}` | Delete profile |
| `GET /minerals` | Full mineral catalogue (no auth) |
| `GET /{id}/collection` | Cards owned + silhouettes for unowned |
| `POST /{id}/daily-card` | Claim daily pack (streak tracking, weighted rarity, no dupe check) |
| `GET /{id}/badges` | All badges with earned/unearned state |
| `GET /{id}/detective/cases` | All 20 cases with unlock state, solve state |
| `POST /{id}/detective/{case_id}/submit` | Submit answer (tiered reward: rare/uncommon/common by attempts 1/2/3+) |
| `GET /parent-summary` | Parent dashboard: cards, badges, cases_solved per profile |
| `POST /seed` | Manual re-seed (no auth required, idempotent) |

**Detective answer format:** Case `options[]` are mineral NAMES (e.g. `"Muscovite Mica"`). Case `correct_id` is a mineral SLUG (e.g. `"muscovite"`). The submit endpoint looks up the mineral by slug to get its name and compares to the submitted answer. This was a bug that was fixed — it now works correctly.

**Detective case unlock:** `unlock_day` field on each case. Cases with `unlock_day=0` are always available. Others unlock when the junior profile is `>= unlock_day` days old. This is the case rotation mechanism.

**Badge evaluation** runs server-side on `daily_claim`, `detective_solve`, and `booking_complete` events. Checks: first_find (1 card), field_5 (5 cards), field_20 (20 cards), rarity_rare, rarity_legendary, streak_7, full_set (all 43 cards), detective_1, detective_5, detective_all. Badges can unlock card rewards.

**Cross-trigger from bookings:** When `PATCH /api/bookings/{id}/complete` is called, it finds all JuniorProfiles for the visitor and calls `award_booking_badge()` for each. This awards the `booking_first` badge.

#### Frontend pages

| URL | Game | Status |
|---|---|---|
| `/junior` | Profile selector / landing | ✅ |
| `/junior/setup` | Create profile (12 emoji avatars, 3 age ranges) | ✅ |
| `/junior/[id]` | Hub: 6 game tiles, streak display, daily pack alert | ✅ |
| `/junior/[id]/collection` | **Game 1: Specimen Collector** | ✅ |
| `/junior/[id]/detective` | **Game 2: Rock Detective** | ✅ |
| `/junior/[id]/explore` | **Game 3: Formation Explorer** | ⚠️ Partial |
| `/junior/[id]/dig` | **Game 4: Dig Site Simulator** | ⚠️ Partial |
| `/junior/[id]/match` | **Game 6: Mineral Match** | ⚠️ Partial |
| `/junior/[id]/badges` | **Game 5: Junior Badges** | ✅ |

Junior Club link visible in navbar "My Digby" dropdown for visitor accounts.

#### Known gaps vs. full spec

**Formation Explorer (Game 3)** — built as a basic Mapbox map showing OMI dots with click-to-popup. The full spec requires: province unlock mechanic (answer 3 questions OR log a find from that region), per-user province unlock state in MongoDB, find-based auto-advancement, real site booking → "I was here" marker. **None of that is built.** The page just shows the OMI tileset on a map.

**Mineral Match (Game 6)** — client-side random deck each session. The spec requires a server-side seed so all players get the same daily set. The daily server seed is not implemented. Game is fully playable but not "daily challenge" format.

**Dig Site Simulator (Game 4)** — premium site unlock (higher rare drop rates when you've booked a real Digby site) is not wired. Backend endpoint `GET /api/junior/sites/:userId` (for premium unlock status) does not exist. Game is fully playable with static site definitions.

**Find → card unlock** — the spec says logging mineral X in the Find Journal should unlock card X in the Junior collection. This cross-trigger is not implemented. The find journal and junior collection are separate systems with no connection.

**Shareable collection link** — not implemented.

**Age scaling** — age range is stored on the profile and displayed, but does not auto-scale game difficulty (the spec called for larger targets + simpler labels for 6-8 year olds).

---

### Visitor Passport (adult system — separate from Junior) ✅

Described above under "Visitor Passport". Auto-stamp on booking completion. Points system. 4 badge tiers. Leaderboard. Public profile view at `/passport/[id]`. Personal view at `/passport`.

---

### Scavenger Hunts ✅

Routes: `/api/hunts/` — operator-created hunts attached to sites. Visitor starts hunt, logs clue completions, earns 100 passport points on completion.

Frontend: `/sites/[id]/hunt`, operator dashboard `/dashboard/hunts/new`, `/dashboard/hunts/[id]/edit`

---

### Guides & Guide Bookings ✅

Routes: `/api/guides/`, `/api/guide-bookings/`, `/api/guide-reviews/`

Guide profile with specialties, years experience, certifications, rate_per_day, guide_location, is_verified. Guide bookings separate from site bookings. Guide reviews.

Frontend: `/guides` (browse), `/guides/[id]` (profile), `/dashboard/guide` (guide's own dashboard)

---

### Weather Alerts ✅

Routes: `/api/weather-alerts/`, `/api/alerts/` (subscriptions)

Operators post weather alerts for their sites. Visitors can subscribe to site alerts. `/alerts` frontend page.

---

### Yield Reports ✅

Route: `/api/yield-reports/`

Operators post what minerals were found at their site for a given date. Visible on site detail page.

---

### Diary / Trip Journal ✅

Route: `/api/diary/`

Personal trip journal entries with points (diary_points used in passport scoring). Frontend: `/diary`, `/diary/new`, `/diary/[id]`

---

### Quiz ✅

Route: `/api/quiz/`

Education quiz with points awarded to passport score. Frontend: `/quiz`

---

### Mineral School / Field Guides ✅

Route: `/api/field-guides/`

Site-specific mineral field guides. Frontend: `/mineral-school`, `/mineral-school/[slug]`

---

### Specimen Marketplace (placeholder) ⚠️

Route: `/api/specimens/` — Specimen and SpecimenOrder models exist, Stripe PaymentIntent flow for specimen purchases exists, webhook handles payment_failed (restores stock). Frontend: `/specimens`, `/specimens/[id]`

Status: Working backend with payment flow. Frontend is largely a placeholder/stub. Not actively marketed.

---

### Waitlist ✅

Route: `/api/waitlist/` — users join waitlist for specific site + date. When a booking is cancelled, the first un-notified waiter gets an email via `send_email()`.

Frontend: `/api/waitlist` (backend only, form embedded on site detail page)

---

### Site Questions ✅

Route: `/api/site-questions/` — Q&A on site detail pages

---

### Partners ✅

Route: `/api/partners/` — PartnerBusiness records, linked to operators

---

### Community Page ✅

Frontend: `/community` — public community page

---

### Mystery Dig ✅

Frontend: `/mystery` — form picks province + mineral preference, creates a mystery booking via `POST /api/bookings/mystery`. Site identity hidden until after payment.

---

## What Is NOT Started

### Section 9 — Youth & Social Strategy

Built:
- ✅ UV Gallery at `/gallery/uv` — dark stone-950 page, per-colour glow shadows, square 4-col grid, colour filter chips (All/Green/Blue/Red/Orange/White/Multi), hover overlay with mineral name + fluorescence, UV badge per card
- ✅ `uv_fluorescence` field on Find model + feed filter params (`uv_only`, `uv_colour`)
- ✅ `is_haul` field on Find model
- ✅ Hauls filter on find feed (Zap icon toggle button, `haul_only` feed query param)
- ✅ UV fluorescence selector + haul checkbox on `/finds/new` form

Not started:
- "What's In Your Bag" flat-lay template
- Specimen drop page at `/drops/:slug`
- Creator directory page
- Co-branded content templates

### Section 10 — Expert & Professional Features
None built:
- Expert profiles & credentialing (P.Geo, P.Eng, MSc/PhD, OGS/GSC, GIS Professional tiers)
- Community Reviewer tier
- Expert verification dashboard / queue
- Formation analytics
- GIS data export (GeoJSON, shapefile, CSV)
- Public API v1

### Section 11 — Senior & Legacy Features
None built:
- Legacy data digitisation
- Batch CSV import
- Club accounts + club event pages
- Email digest
- Printable field cards / find log sheets
- GPS track import (GPX)
- ArcGIS / QGIS integrations

### Section 12 — Digby Seismic
Gated. Requires legal review (PIPEDA, App Store sensor data policies), OGS pre-conversation, and native mobile app. **Do not build.**

---

## Strata Admin Tools (Deadline: Aug 1, 2026)

All three items complete:
1. ✅ Admin: subscriber list (name, tier, status, renewal date, shipping address) — `/admin/strata`
2. ✅ Admin: box fulfilment status (which subscribers received which box months) — `/admin/strata/fulfilment`
3. ✅ Admin: shipping label CSV export — "Labels CSV" button in fulfilment page → `GET /api/admin/strata/shipping-labels/{box_month}` (returns CSV, excludes already-shipped)

---

## Key Environment Variables

| Variable | Purpose |
|---|---|
| `MONGODB_URL` | Atlas connection string |
| `JWT_SECRET` | 64-char hex string |
| `STRIPE_SECRET_KEY` | Stripe secret |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |
| `STRIPE_PLATFORM_FEE_PERCENT` | Default 12 |
| `ANTHROPIC_API_KEY` | For mineral identifier |
| `AWS_ACCESS_KEY_ID` | S3 uploads |
| `AWS_SECRET_ACCESS_KEY` | S3 uploads |
| `AWS_S3_BUCKET` | `digby-uploads-327205296256` |
| `AWS_S3_REGION` | `ca-central-1` |
| `NEXT_PUBLIC_API_URL` | Backend URL seen by frontend |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `ADMIN_PASSWORD` | Admin UI password |
| `BACKEND_CORS_ORIGINS` | Comma-separated allowed origins |

---

## Railway Deployment Notes

- Backend crashes on startup → Railway returns 502 with **no CORS headers** (distinguishable from FastAPI errors which always have CORS headers)
- Auto-seed runs on every deploy via `lifespan()` in `main.py` — idempotent, safe
- Frontend uses `NEXT_PUBLIC_*` env vars baked at build time (Railway rebuilds on env var change)
- Stripe webhook URL must be registered in Stripe Dashboard as the Railway backend URL + `/api/payments/webhook`
- `STRIPE_WEBHOOK_SECRET` and `ANTHROPIC_API_KEY` are not in the local `.env` — those features (webhooks, mineral ID) only work in Railway production

---

## Suggested Next Priorities

1. **Junior Formation Explorer (full spec)** — province unlock mechanic, per-user state, find-based progression
3. **Junior find → card cross-trigger** — log find X → unlock junior card for mineral X
4. **Section 9 remainder** — "What's In Your Bag" flat-lay template, specimen drops, creator directory
5. **Expert features (Section 10)** — large spec, start with expert profile + credentialing

---

## Appendix: Mistakes Made During Previous Handoffs

A record of errors made while producing this document, for Claude's accountability and to help future sessions avoid the same problems.

### 1. Geology map described as incomplete when it was complete
The first version of this document said "Awaiting Robin's Mapbox Studio tileset setup" and listed the manual Mapbox Studio steps as still open. In reality, both tilesets had already been uploaded, IDs were confirmed, field names were hardcoded in the map page, and the env vars were set. iPhone Claude read this and incorrectly concluded the map feature was unfinished.

**Root cause:** Claude trusted the outdated `digby-todo.md` checkbox list instead of reading the actual source files.

### 2. Mapbox tilesets are now replaced by local GeoJSON
After the tileset approach was confirmed correct, the geology layers were subsequently migrated away from Mapbox tilesets entirely. The OGS shapefiles were converted to GeoJSON with a Python script and placed in `frontend/public/geodata/`. The map page was updated to use `type="geojson"` sources instead of `type="vector"`. The two tileset env vars (`NEXT_PUBLIC_MAPBOX_TILESET_BEDROCK`, `NEXT_PUBLIC_MAPBOX_TILESET_MINERAL_OCCURRENCES`) are no longer used and should not be set.

**Note for future sessions:** If you see any reference to Mapbox tilesets for the bedrock or OMI layers, it is stale. The layers are driven by local static files.

### 3. Failed to find the `.env` file using shell commands
When asked to verify whether env vars were set, Claude ran `type .env` via the Bash tool (a Unix shell builtin that looks up command types, not file contents), then ran PowerShell `Get-ChildItem` which also returned nothing, and concluded the file didn't exist. The file was at `c:\dev\digby\.env` the entire time. The Read tool found it immediately when finally used.

**Root cause:** Reached for shell tools instead of using the Read tool directly on the known path. Assumed the file didn't exist after the first failed command instead of trying the right tool.
