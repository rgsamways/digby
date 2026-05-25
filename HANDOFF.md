# Digby.rocks — Complete Project Handoff
_Last updated May 25, 2026 by Claude Code from direct code inspection. This document reflects the actual state of the codebase, not the todo list (which is outdated in several places)._

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
    components/          Navbar, LessonNavButton, etc.
    lib/
      api.ts             HTTP client wrapper
      auth.ts            JWT helpers, useAuthStore (Zustand)
      junior.ts          Junior Club API + TypeScript interfaces
      cart.ts            Cart store (Zustand + localStorage)
      accessibility.ts   useLargeText() hook (localStorage + html class toggle)
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

**Known issue:** Stripe webhook secret mismatch suspected on Railway. Endpoint URL must be `https://digby-production.up.railway.app/api/payments/webhook`. Verify `STRIPE_WEBHOOK_SECRET` matches the current Stripe Dashboard signing secret (it changes each time the endpoint is recreated in Stripe).

---

### Visitor Passport ✅

Route: `/api/passport/`
- `GET /me` — stamps, points, badges, hunt completions, quiz sessions, diary entries, **citizen_science_finds count**
- `GET /leaderboard` — top 10 by points
- `GET /{visitor_id}` — public passport view
- `POST /stamp` — manually add stamp (idempotent by booking_id)

Stamps are **auto-created** in `bookings.py` when `PATCH /{id}/complete` is called.

Passport badges (adult, not junior):
- `first_dig` (1 visit), `rock_hound` (5), `gem_hunter` (10), `mineral_master` (25)

Points: 25/stamp + 10/unique mineral + 100/hunt + quiz points + diary points

**Citizen science:** Passport now shows `citizen_science_finds` (count of opted-in finds). Rendered as inline stat in passport hero + dedicated OGS callout block when count > 0.

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
- One-tap "Log to Find Journal" is wired: pre-populates `/finds/new?mineral=X&notes=Y&host_rock=Z&province=P&formation=F&verification=ai_likely` via query params
- **Formation auto-fill:** `typical_formations[0]` from AI result is passed as `formation` query param, auto-populating the formation field in the find form

---

### File Upload / S3 ✅

Route: `POST /api/uploads/images` (requires auth)

- boto3, bucket `digby-uploads-327205296256`, region `ca-central-1`
- Accepts: JPEG, PNG, WebP, GIF; max 10 MB each; up to 8 files per request
- Returns: `{"urls": ["https://digby-uploads-327205296256.s3.ca-central-1.amazonaws.com/uploads/{user_id}/{uuid}.jpg", ...]}`
- Bucket has public GetObject policy — URLs are directly embeddable
- Used by: **Find Journal** (find form calls this before creating the find), **Product admin** (URL input for now, not upload)

---

### Find Journal + Citizen Science ✅

Routes at `/api/finds/`:
- `POST /` — create find
- `GET /my` — user's finds (all, sorted by date)
- `GET /feed` — public feed (filterable: mineral, province, verification, featured_only, uv_only, uv_colour, haul_only; paginated)
- `GET /feed/saved` — user's saved finds
- `GET /{id}` — single find (SSR-compatible, privacy enforced)
- `PATCH /{id}` + `DELETE /{id}` — edit/delete (owner only)
- `POST /{id}/save` — toggle save/bookmark
- `GET /admin/export` — CSV of all citizen-science-eligible finds (requires admin token)
- `POST /import` — bulk CSV import (up to 500 rows), returns `{created, skipped, total}`
- `GET /export/geojson` — GeoJSON FeatureCollection of user's GPS-tagged finds (auth required)

**Find model fields:** user_id, date, mineral_name, notes, photo_urls[], gps_lat, gps_lng, site_id, site_name, host_rock, geological_province, formation, specimen_quality, verification_status (unverified/ai_likely/community_verified/ogs_reviewed/disputed), citizen_science_opted_in, citizen_science_eligible (computed), visibility (public/private), save_count, is_featured, is_junior_submission, uv_fluorescence (green/blue/red/orange/white/multi/null), is_haul (bool)

**Citizen science eligibility** is auto-computed on save: requires GPS + at least one photo + verification ≥ ai_likely + host_rock + opted_in.

**UV nudge:** After a find is submitted without UV fluorescence, an inline UV prompt banner appears on the new find page instead of immediately navigating away. User can add UV data (PATCH) or skip.

**Photo upload to S3 IS wired** in the find form — the `/finds/new` page calls `/api/uploads/images` before creating the find, then passes the returned URLs in `photo_urls`.

Frontend: `/finds` (public feed), `/finds/my` (private journal with GeoJSON export + import link), `/finds/new` (log form), `/finds/[id]` (SSR, 60s revalidation), `/finds/import` (CSV bulk import)

**GeoJSON export:** Authenticated fetch triggers a blob download (uses auth header, not a plain `<a>` tag). GeoJSON includes: mineral name, date, province, formation, coordinates, verification status, citizen science flag.

**CSV import:** Drop zone, template download, in-browser CSV parse with preview (first 5 rows), error list for skipped rows, success state.

---

### Find Verification ✅

Route file: backend handles verification_status on Find model. Expert verification dashboard at `/expert/verify`.

Verification tiers:
- `unverified` — default
- `ai_likely` — set by Mineral ID flow
- `community_verified` — set via expert verify page
- `ogs_reviewed` — set via expert verify page (OGS-credentialed users only)
- `disputed` — flagged by community

---

### Expert Network ✅

Routes: `/api/experts/`

Expert profiles with credentials (P.Geo, P.Eng, MSc/PhD, OGS/GSC, GIS Professional tiers) visible at `/experts`. Expert credentialing page for users to register expert status.

---

### UV Gallery ✅

Frontend: `/gallery/uv` — dark stone-950 page, per-colour glow shadows, square 4-col grid, colour filter chips (All/Green/Blue/Red/Orange/White/Multi), hover overlay with mineral name + fluorescence, UV badge per card.

Backed by find feed with `uv_only=true` filter.

---

### Hauls ✅

`is_haul` field on Find model. Haul filter on find feed (Zap icon toggle, `haul_only` query param). Homepage featured haul section.

---

### Specimen Drops ✅

Routes: `/api/drops/`

Frontend: `/drops` (listing), `/drops/[slug]` (detail page). Operator-posted specimen drops with images, price, weight, provenance, claim button.

---

### Creator Directory ✅

Routes: `/api/creators/`

Frontend: `/creators` — directory of verified creator accounts with profile cards, specialties, and links to their public finds and specimens.

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

Lesson completion is tracked server-side: `LessonNavButton` (frontend component) POSTs to `/api/junior/{id}/lesson-complete` when the user advances to the next lesson. This feeds the `mineral-scholar` badge (5 track completions).

---

### Club Accounts ✅

Routes at `/api/clubs/`:
- `POST /` — create club (auto-slugged, owner membership auto-created)
- `GET /` — public clubs + user's private clubs
- `GET /mine` — user's memberships with role
- `GET /{slug}` — detail with members + up to 30 recent public finds from all members
- `POST /{slug}/join` — join public club (prevents duplicates)
- `DELETE /{slug}/leave` — leave (non-owners only)
- `DELETE /{slug}` — delete club + all memberships (owner only)

Models: `Club` + `ClubMembership` in `backend/app/models/club.py`. Registered in `database.py`.

Frontend: `/clubs` (browse + create), `/clubs/[slug]` (detail: member list, recent finds feed, leave/delete buttons)

Clubs visible in navbar "My Digby" dropdown.

---

### Accessibility ✅

- `useLargeText()` hook in `frontend/lib/accessibility.ts` — reads `digby_large_text` from localStorage, applies `large-text` class to `document.documentElement`
- `frontend/app/globals.css` — `html.large-text` rules: 18px base font, 1.75 line-height, min-height 2.75rem on inputs/buttons, 1rem on p/li/label
- Toggle button in desktop Navbar user dropdown (above "Log out") and mobile menu (always visible, `<Type>` icon)

---

### Junior Geologist Games ✅ (all 6 games wired to backend)

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

`JuniorProfile` also has `lessons_completed: list[str]` — stores keys as `"track:lesson-slug"` strings.

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
| `POST /{id}/daily-card` | Claim daily pack (streak tracking, weighted rarity) |
| `GET /{id}/badges` | All badges with earned/unearned state |
| `GET /{id}/detective/cases` | All 20 cases with unlock state, solve state |
| `POST /{id}/detective/{case_id}/submit` | Submit answer (tiered reward: rare/uncommon/common by attempts 1/2/3+) |
| `POST /{id}/dig-complete` | Called on dig game end + match game win — unlocks cards for found minerals, evaluates badges |
| `POST /{id}/lesson-complete` | Called by LessonNavButton — records track:lesson key, evaluates mineral-scholar badge |
| `GET /{id}/provinces` | Returns provinces explored via parent's find logs, evaluates province-explorer badge |
| `GET /parent-summary` | Parent dashboard: cards, badges, cases_solved per profile |
| `POST /seed` | Manual re-seed (no auth required, idempotent) |

**Badge evaluation** runs server-side on multiple triggers. All 19 badges are evaluatable including the three previously broken gated badges:
- `deep-digger` — triggered by `dig-complete` event (dig game end or match game win)
- `mineral-scholar` — triggered by `lesson-complete` when `track_lessons_completed >= 5`
- `province-explorer` — triggered by `GET /provinces` when province count >= 1

#### Frontend pages

| URL | Game | Status |
|---|---|---|
| `/junior` | Profile selector / landing | ✅ |
| `/junior/setup` | Create profile (12 emoji avatars, 3 age ranges) | ✅ |
| `/junior/[id]` | Hub: 6 game tiles, streak display, daily pack alert | ✅ |
| `/junior/[id]/collection` | **Game 1: Specimen Collector** | ✅ |
| `/junior/[id]/detective` | **Game 2: Rock Detective** | ✅ |
| `/junior/[id]/explore` | **Game 3: Formation Explorer** | ✅ Province unlock wired |
| `/junior/[id]/dig` | **Game 4: Dig Site Simulator** | ✅ Card unlock + badge wired |
| `/junior/[id]/match` | **Game 6: Mineral Match** | ✅ Card unlock + badge wired |
| `/junior/[id]/badges` | **Game 5: Junior Badges** | ✅ |

Junior Club link visible in navbar "My Digby" dropdown for visitor accounts.

#### Remaining gaps vs. full spec

**Dig Site Simulator (Game 4)** — premium site unlock (higher rare drop rates when you've booked a real Digby site) is not wired. The cross-check against real Digby bookings is not implemented.

**Mineral Match (Game 6)** — client-side random deck each session. The spec calls for a server-side seed so all players get the same daily set. Not implemented.

**Find → card unlock cross-trigger** — the spec says logging mineral X in the Find Journal should unlock card X in the Junior collection. This is not implemented — find logging and junior collection are separate systems.

**Shareable collection link** — not implemented.

**Age scaling** — age range stored on profile but does not auto-scale game difficulty.

---

### Visitor Passport (adult system — separate from Junior) ✅

Described above under "Visitor Passport". Auto-stamp on booking completion. Points system. 4 badge tiers. Leaderboard. Public profile view at `/passport/[id]`. Personal view at `/passport`. Citizen science find count now shown.

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

### Remaining Section 11 Items

- Email digest
- Printable field cards / find log sheets
- GPS track import (GPX)
- ArcGIS / QGIS integrations

### Section 12 — Digby Seismic

Gated. Requires legal review (PIPEDA, App Store sensor data policies), OGS pre-conversation, and native mobile app. **Do not build.**

---

## OGS Citizen Science Pipeline — Technical Complete, Robin Action Needed

Technical side is fully built:
- `citizen_science_opted_in` + `citizen_science_eligible` flags on Find model
- `GET /api/finds/export/geojson` returns opted-in finds as GeoJSON FeatureCollection
- Passport shows citizen science find count + OGS thank-you callout block
- Admin CSV export at `GET /api/finds/admin/export` (admin token required)

**Robin still needs to:**
1. Contact OGS Resident Geologist for his region at `mndm.gov.on.ca` / Resident Geologist Program
2. Confirm accepted data format (GeoJSON ready, CSV available)
3. Sign voluntary data contribution agreement / MOU (ask for their standard template)
4. Decide on cadence (quarterly GeoJSON/CSV drop to OGS email, or push to OGS API if one exists)
5. Optional fast-track: approach geology professor at Laurentian/U of T/Queens as academic co-investigator under existing OGS research umbrella
6. Professor William H. Blackburn (UWindsor) — Robin's personal geology professor, direct outreach letter still not sent

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

1. **Strata shipping label export** — subscriber addresses → CSV for Canada Post (admin tool, deadline Aug 1)
2. **Junior find → card cross-trigger** — log find with mineral X → unlock junior card for mineral X (cross-system wiring)
3. **Junior dig premium unlock** — check booking history to give higher rare drop rates at booked sites
4. **Prospector Track lessons** — new Learn the Land track, content captured as Robin goes through the prospecting process

---

## Appendix: Mistakes Made During Previous Handoffs

A record of errors made while producing this document, for Claude's accountability and to help future sessions avoid the same problems.

### 1. Geology map described as incomplete when it was complete
The first version of this document said "Awaiting Robin's Mapbox Studio tileset setup" and listed the manual Mapbox Studio steps as still open. In reality, both tilesets had already been uploaded, IDs were confirmed, field names were hardcoded in the map page, and the env vars were set.

**Root cause:** Claude trusted the outdated `digby-todo.md` checkbox list instead of reading the actual source files.

### 2. Mapbox tilesets are now replaced by local GeoJSON
After the tileset approach was confirmed correct, the geology layers were subsequently migrated away from Mapbox tilesets entirely. The OGS shapefiles were converted to GeoJSON with a Python script and placed in `frontend/public/geodata/`. The map page was updated to use `type="geojson"` sources instead of `type="vector"`. The two tileset env vars (`NEXT_PUBLIC_MAPBOX_TILESET_BEDROCK`, `NEXT_PUBLIC_MAPBOX_TILESET_MINERAL_OCCURRENCES`) are no longer used and should not be set.

**Note for future sessions:** If you see any reference to Mapbox tilesets for the bedrock or OMI layers, it is stale.

### 3. Failed to find the `.env` file using shell commands
When asked to verify whether env vars were set, Claude ran `type .env` via the Bash tool (a Unix shell builtin), then ran PowerShell `Get-ChildItem` which also returned nothing, and concluded the file didn't exist. The file was at `c:\dev\digby\.env` the entire time. The Read tool found it immediately when finally used.

**Root cause:** Reached for shell tools instead of using the Read tool directly on the known path.

---

## New Learn the Land Track: Prospector Track

### Status: NOT YET BUILT — content planned, code not written

The two existing tracks (Field + GIS) live entirely in `frontend/lib/learn-content.ts` as a `TRACKS` array. The learn page at `frontend/app/(site)/learn/page.tsx` renders whatever is in that array, so adding the Prospector Track means:
1. Adding a new `Track` object to `TRACKS` in `learn-content.ts` with a new `id` (e.g. `"prospector"`) and 8 `Lesson` objects
2. Updating the `Track` interface `id` type: `"field" | "gis"` → `"field" | "gis" | "prospector"`
3. Adding the icon/colour case to the learn page (currently hardcodes `Map` for "field" and `BookOpen` for "gis")
4. Updating `getLesson()` to accept the new track id

No backend changes required — lessons are static content rendered client-side.

### Content plan

Practical, experience-based content written from Robin's lived experience learning Ontario mineral rights and prospecting in real time. Tone is authentic and first-person, not textbook.

Planned lessons (none written yet):
1. Do I need a prospector's licence? (commercial vs personal collecting, why wholesale is the clean path)
2. Reading the MLAS map (claims, grid cells, alienation, how to identify open land, claim expiry)
3. Understanding cell status codes (Available, Code C — known restrictions, what each means)
4. Ground truthing — why you always visit before you stake
5. Finding and researching historical mineral occurrences (MDI/OMI numbers, AMIS records, assessment files)
6. Staking a claim — the actual process step by step
7. Working with private landowners — access agreements, surface rights
8. Sourcing specimens legally for commercial use

Content is being captured in real time as Robin goes through the process personally. **Do not write lesson content without Robin's input** — each lesson reflects what he's actually done, not textbook theory. Ask Robin which lessons he's ready to write before building.

---

## Prospecting Research

### Hound Lake Graphite Occurrence

- MDI number: MDI31E01NE00012
- AMIS abandoned mine record: 07760
- Commodity: Flake graphite
- Location: Herschel Township, Lot 24-25, Concession 10-11
- Actual coordinates: 45°08'49.9"N 78°01'41.8"W (NOT at Hound Lake itself — further west)
- Features: Adit + trench documented

Work history:
- 1912-1913: W. Wallace, J. Wallace, E. Woolton — pitting, trenching, adit (graphite boom era)
- 1942: Testing of flake graphite (wartime critical material)
- 1989: Harrington Sound Resources Inc. — mapping, prospecting, sampling, ground geophysics

Ground truthed May 24, 2026 — Robin visited the area. Ice storm damage, heavy overgrowth, not currently accessible. Was approximately halfway between Dog Bay Road and the actual coordinates. Full site visit at exact coordinates still pending.

Next research step: Search Ontario Assessment File system at geologyontario.mines.gov.on.ca for Harrington Sound Resources 1989 reports — Herschel Township, 1985-1995 date range.

Unstaked cells in the Hound Lake area (confirmed on MLAS map May 24, 2026):
31E01H077, 31E01H119, 31E01H120, 31E01H139, 31E01H140

Note: Robin has not yet obtained a prospector's licence. MAAP not yet started. No claims staked.

---

## Strata Suppliers

### Princess Sodalite Mine

- Princess Sodalite Mine, Highway 28 East, ~4km outside Bancroft
- Self-collect "rock farm" model — visitors chip away at surface material
- Price: $3 CAD/lb for good quality sodalite
- Requirements: steel toed boots, safety glasses
- Owner was absent on May 24 visit — card obtained, follow-up needed
- Need to confirm: is breaking permitted on rock farm, or take whole pieces home?
- First collecting visit planned: May 25, 2026 (weather dependent)
- Gear needed: 3-4 lb hand sledge, cold chisels, safety glasses, steel toes, sturdy transport box, small scale

---

## Strata Product Design

### Box Format (confirmed)

- Individual specimens presented in perky boxes (clear acrylic with foam insert)
- Grid layout inside branded outer rigid box (kraft exterior, dark interior)
- Story card on top of grid when lid is opened
- Accessories (UV keychain, loupe etc) in dedicated space alongside grid

### Tier Specimen Counts

- Discoverer $39/mo: 3-4 specimens, 2x2 perky box grid
- Collector $59/mo: 5-6 specimens, 2x3 grid, UV keychain included
- Geologist $89/mo: 7-8 specimens, 2x4 grid, UV keychain, fold-out map or provenance document

### Suppliers

- Outer box: Packlane.com (25 unit minimum, ~3 week lead time)
- Individual specimen boxes: Shannon Family Minerals (shannonsminerals.com), Fausto's Boxes

Next physical step: Order sample perky boxes from Shannon's to measure and mock up outer box dimensions before ordering from Packlane.

### 12-Month Theme Calendar

- Month 1: Welcome to Bancroft (origin story — feldspar, tourmaline, calcite, sodalite)
- Month 2: The Canadian Shield (deep time — gneiss, granite, amphibolite)
- Month 3: Iron & Fire (magnetite, hematite, pyrite, marcasite)
- Month 4: Hidden Light (fluorescent minerals — UV Gallery launch box, UV keychain in all tiers)
- Month 5: Crystal Clear (quartz in all forms — smoky, milky, phantom, amethyst)
- Month 6: The Gemboree Box (show-stopping specimens, Bancroft provenance, limited feel)
- Month 7: Blue & Green (amazonite, chrysocolla, malachite, apatite — colour-themed, social-friendly)
- Month 8: Deep Earth (olivine, pyroxene, hornblende — basalt/mantle minerals)
- Month 9: Fool's Gold & Friends (pyrite, chalcopyrite, arsenopyrite — prospector history angle)
- Month 10: Fossil Ontario (Ordovician marine fossils, southern Ontario limestone)
- Month 11: The Dark Box (tourmaline, obsidian, jet, black calcite — youth/social aesthetic)
- Month 12: Year One Collector's Edition (one significant specimen, rewards loyalty)

Note: Month 4 Hidden Light deliberately timed to coincide with UV Gallery feature launch. Month 6 timed to Bancroft Gemboree season.

---

## Prospector's Licence — Status

- Robin has not yet enrolled in the Ontario Prospector's Licence program
- MAAP (Mining Act Awareness Program) not yet completed
- Steps: Complete MAAP at mlas.mndm.gov.on.ca/maapp/en → Register MNDM client account → Purchase licence through MLAS
- Urgency: moderate — unstaked cells identified near Robin's property, licence needed before staking

---

## Apple Developer Account — Status

- Robin's current Apple ID: rgsamways@gmail.com
- Previous developer account email unknown and unrecoverable — Apple support unable to help
- New enrollment attempts failing — web enrollment loop (laptop pushes to phone, phone can't complete, web returns "could not be completed at this time")
- iTunes installed on Windows laptop — still failing
- Resolution path: unknown — cloud Mac rental was one idea but not confirmed
- Needed for: any iOS/mobile development, Digby Seismic (already gated for other reasons)
- Status: blocked, Apple support call scheduled for May 25, 2026 — awaiting outcome

---

## Reminders: Do Not Forget

- **OGS citizen science pipeline** — Robin still needs to contact the OGS Resident Geologist and get a data-sharing MOU in place. Technical side is complete. See OGS section above for full action list.
- **Professor William H. Blackburn** (UWindsor mineralogist, Robin's geology minor professor) — personal outreach letter from Robin as alumni still not sent. Digby is the direct descendant of his field trip. Meaningful connection worth making.
- **Prospector Track** — new Learn the Land content track, capturing Robin's real-time prospecting education. Do not let this get lost.
- **Strata Gemboree deadline: August 1, 2026** — must have shipping label export and first box contents ready.
