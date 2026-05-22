# digby.rocks — Master Todo List
_Last updated: May 2026. Maintained by Claude Code. Hand back to Claude (chat) for review and discussion._

---

## How This Works
- Claude Code updates task status as work completes
- Robin hands this doc back to Claude (chat) to review progress, discuss next steps, and add new tasks
- Status labels: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## 1. Shop — Core Build
- [x] MongoDB products collection + schema
- [x] MongoDB orders collection + schema
- [x] MongoDB indexes (slug unique, category, tags, site_recommendations, active)
- [x] GET /api/products (filter by category, subcategory, tag, site_slug; skip/limit pagination)
- [x] GET /api/products/:id (slug or ObjectId; returns product + up to 4 related)
- [x] POST /api/shop/orders/intent (validate, check stock, calculate total + shipping, create Stripe PaymentIntent in CAD)
- [x] GET /api/shop/orders/my (user-scoped order list)
- [x] GET /api/shop/orders/:id (user-scoped order detail)
- [x] POST /api/webhooks/stripe (verify sig, idempotency check, order_type routing, decrement stock, insert order)
- [x] Shop listing page /shop with category tabs
- [x] Product detail page /shop/[slug]
- [x] Cart (Zustand + localStorage, guest-friendly)
- [x] Checkout: cart → address → Stripe PaymentElement → confirmation
- [x] Order history page /shop/orders
- [ ] Decide image storage: Cloudflare R2 or S3
- [ ] Decide shipping: Canada Post API or flat-rate ($12.99 CAD placeholder currently)

## 2. Shop — Admin UI
> Spec: Claude Code Handoff Document (Section 1, May 2026)
- [x] Admin session auth — ADMIN_PASSWORD env var, JWT with role=admin, /admin routes protected
- [x] Product list view (paginated, name / category / price / stock / active)
- [x] Create / edit product form — all fields: name, slug (auto-generated, editable), category + subcategory dropdowns, description, price + cost (display as dollars), SKU, supplier, stock, dropship toggle, active toggle, tags multi-input, related_products selector, site_recommendations selector
- [x] Image upload — stubbed as URL input (S3 decided, actual upload integration pending)
- [x] Soft delete / deactivate product (active: false)
- [x] Order list view (status, total, customer, date)
- [x] Order detail view (line items, shipping address, Stripe payment ID, status)
- [x] Manual order status update (pending → confirmed → fulfilled → shipped → cancelled)

## 3. Digby Strata — Subscription Box
> Spec: digby-strata-spec.docx (May 2026). **Bancroft Gemboree deadline: August 1, 2026.**
- [x] StrataSubscription Beanie model (tier, billing_frequency, status, subscriber_id, stripe_subscription_id)
- [x] Box model (month number, theme, contents list, field_card_text, formation_map_url, shipped_at)
- [x] CollectorCardCode model (code, mineral_id, box_id, redeemed_by, redeemed_at)
- [x] Stripe Billing integration (recurring subscriptions — price_data inline, payment_behavior=default_incomplete)
- [x] POST /api/strata/subscribe (create Stripe subscription + subscriber record)
- [x] GET /api/strata/my (subscriber portal data: tier, status, box history)
- [x] PATCH /api/strata/my (update address, pause/resume via pause_collection)
- [x] DELETE /api/strata/my (cancel at period end — no dark patterns)
- [x] POST /api/strata/gift (PaymentIntent for fixed months)
- [x] GET /api/strata/redeem/:code (validate collector card code, mark redeemed)
- [x] /strata sign-up page — tier selection (Discoverer $39 / Collector $59 / Geologist $89), billing frequency, shipping address, Stripe PaymentElement
- [x] /strata/archive — every past box: contents, field card text, formation map, dig site links
- [x] /strata/my subscriber portal (manage tier, pause, cancel, see renewal date)
- [x] Cancellation and pause flows with confirmation dialogs (no dark patterns)
- [x] Annual prepay discount option (10% off, 12 × monthly × 0.90)
- [x] Webhook handlers: invoice.payment_succeeded (activate), invoice.payment_failed (past_due), subscription.deleted (cancelled)
- [ ] Admin tools: subscriber list, box fulfilment status, shipping label export
- [ ] Collector card UTM tracking — measure booking conversions from Strata subscribers

## 4. Geology Map Overlay
> Spec: Claude Code Handoff Document (Section 2, May 2026)
- [ ] **Manual step (Robin):** Download OGS shapefiles from geohub.lio.gov.on.ca — Bedrock Geology, MDI, Past Producing Mines
- [ ] **Manual step (Robin):** Upload shapefiles to Mapbox Studio as tilesets, note tileset IDs (format: yourusername.xxxxxxxx)
- [ ] **Manual step (Robin):** Inspect each tileset in Mapbox Studio feature inspector — note exact field names for formation name, rock type, geological province, age (bedrock); mineral type, deposit name (MDI); mine name, commodity (past mines)
- [ ] **Manual step (Robin):** Add tileset IDs to env config and update field name TODOs in frontend/app/map/page.tsx
- [x] GET /api/map/sites — GeoJSON FeatureCollection of bookable digby sites (id, name, slug, coordinates, findable minerals, thumbnail)
- [x] /map page with full-screen Mapbox map + collapsible sidebar
- [x] Bedrock geology layer (hover tooltip: formation name; province colour coding)
- [x] Mineral occurrences layer (filterable by mineral type — text input filter)
- [x] Digby sites layer (green circles, click popup: site name, minerals, price, book CTA)
- [x] Past producing mines layer (optional toggle, low visual prominence)
- [x] Layer toggle panel (sidebar with availability indicators)
- [x] Mobile: sidebar collapses to bottom drawer
- [x] Geological province blurbs in sidebar (Grenville, Superior, Southern, Churchill)
- [x] Default view centred on Ontario (lon -84.5, lat 48.0, zoom 5.5)
- [x] Amber notice guiding operator through Mapbox Studio setup when tilesets not configured

## 5. AI Mineral Identifier — Upgrade
> Spec: digby-identifier-upgrade.docx
- [x] Review existing bare-bones implementation
- [x] Multi-photo input (up to 4 images)
- [x] Optional context fields (location, host rock type, UV behaviour, geological province)
- [x] Upgraded to claude-sonnet-4-6 vision API with structured JSON schema
- [x] Confidence scoring with plain-language confidence_reason field
- [x] Visual clues breakdown ("why we think so")
- [x] Differential diagnosis — 2-3 alternatives with practical field tests
- [x] Ontario geological context (province, typical formations, known localities)
- [x] Physical properties reference card (collapsible)
- [x] Specimen quality assessment
- [x] UV fluorescence guidance
- [ ] One-tap log to find journal (pre-populated) — depends on Section 6 Find Journal
- [x] Client-side canvas compression: max 1200px, JPEG@85 (strips EXIF too)
- [ ] HEIC to JPEG conversion — rejected with 415; needs system libheif (deferred)
- [x] Rate limiting: 10/day per IP for unauthenticated; authenticated users exempt
- [x] Result cache: 1h TTL keyed on SHA-256 of images + context
- [x] POST /api/mineral-id/ (existing route, upgraded in place)
- [ ] Ontario mineral reference JSON (static context for system prompt enrichment)
- [ ] Verification status system — depends on Section 6 Find Journal
- [ ] User correction flow — depends on Section 6 Find Journal

## 6. Find Journal + Citizen Science
> OGS partnership proposal commits this to Q3 2026.
- [x] Find journal data model (location, date, site, mineral, formation, quality, photos, notes, visibility, verification)
- [x] Verification pipeline: unverified → ai_likely → community_verified → ogs_reviewed (matches OGS proposal)
- [ ] Formation auto-population from GPS coordinates vs OGS bedrock layer (needs OGS tileset integration)
- [x] Private find journal UI — /finds/my (log, browse, delete)
- [x] Public find feed — /finds (filterable by mineral/province/featured, paginated)
- [x] Individual find page — /finds/[id] with OG meta (SSR, 60s revalidation)
- [x] Save/bookmark mechanic with toggle POST /api/finds/{id}/save
- [x] Weekly featured finds (is_featured flag, admin sets manually in DB)
- [x] Citizen science eligibility: GPS + photo + ai_likely+ + host_rock + opted_in (auto-computed on save)
- [ ] Citizen science status surfaced as achievement on passport — depends on passport integration
- [x] Junior find logging (is_junior_submission field + form checkbox)
- [x] GET /api/finds/feed (paginated, filterable)
- [x] GET /api/finds/feed/saved (user saved finds)
- [x] POST /api/finds/ (create)
- [x] PATCH /api/finds/{id} + DELETE /api/finds/{id}
- [x] POST /api/finds/{id}/save (toggle)
- [x] GET /api/finds/admin/export (CSV for OGS with all citizen science fields)
- [ ] Photo upload to S3 — currently photos captured client-side but not uploaded (S3 integration pending)

## 7. GIS Education Content
> Spec: Claude Code Handoff Document (Section 3, May 2026).
- [x] /learn landing page — track selection, lesson overview
- [x] **Field Track** — 5 lessons, no software required, 5-minute reads, "Try it" prompts
  - [x] Lesson 1: How Ontario's geology formed (deep time, provinces, mineral origin)
  - [x] Lesson 2: Ontario's four geological provinces (Grenville, Superior, Southern, Churchill)
  - [x] Lesson 3: Reading rocks — minerals at Digby sites (feldspar, quartz, mica, tourmaline, apatite)
  - [x] Lesson 4: Crown land, mineral rights, and site access (Mining Act, trespass law)
  - [x] Lesson 5: Planning a trip using the Digby map (layer-by-layer walkthrough)
- [x] **GIS Track** — 5 lessons, QGIS-based, hands-on OGS data
  - [x] Lesson 1: Installing QGIS and loading your first Ontario geology layer
  - [x] Lesson 2: Querying and filtering OGS data with expressions + spatial joins
  - [x] Lesson 3: Symbolizing rock formations by age or type (categorized + rule-based)
  - [x] Lesson 4: Intersecting layers to find mineralizing zones (buffer, heatmap)
  - [x] Lesson 5: From map to site — spatial trip planning with drive-distance buffer + grid scoring
- [x] All lessons reference Ontario geology and link to relevant Digby features
- [x] Field Track "Try it" prompts link to /map and /mineral-id
- [x] GIS Track exercises use real OGS data sources (geohub.lio.gov.on.ca)

## 8. Junior Geologist Games
> Spec: Junior Geologist Games Full Spec (May 2026). Build Games 5 + 1 together — badge system without card game has no payoff.

### Shared Infrastructure (build first)
- [ ] Junior sub-account system (linked to parent, first name + age range, not full birthdate)
- [ ] `junior_minerals` content database (mineral_id, card_art, flavour_text, fun_fact, age_easy_description, age_standard_description, ontario_locality, rarity_tier, detective_clues[], dig_site_associations[], province_associations[])
- [ ] Seed junior_minerals with ~40–50 Ontario minerals
- [ ] `junior_collection` collection (userId, mineralId, unlockedAt, source)
- [ ] `badges` collection (id, name, category, requirement, cardReward)
- [ ] Per-user badge_state (userId, badgeId, earnedAt, triggerEvent)
- [ ] Badge evaluation server-side on trigger events (find logged, booking completed, game milestone)
- [ ] Card unlock event system — triggered by find logs, badge completions, booking completions, daily login
- [ ] Parent dashboard: GET /api/junior/parent-summary/:userId (badges, finds, games, plain-language summary)
- [ ] Age range setting flows difficulty across all games automatically

### Game 5: Junior Geologist Badges (build first — scaffolding)
- [ ] Badge categories: Field (real-world), Knowledge (games + education), Engagement (platform participation)
- [ ] Field badges: First Find, Three-Find Hat Trick, Province Pioneer, Full Shield, Photo Geologist, Citizen Scientist, Master Collector
- [ ] Knowledge badges: Rock Detective Rookie/Case Closed/Master Detective, Province Explorer, Deep Digger, Mineral Scholar, Complete Collection
- [ ] Engagement badges: Site Visitor, Return Explorer, Gear Up, 7-Day Streak, Season Regular
- [ ] Junior Geologist profile page — earned/locked badge display, shareable, most recent badge on dashboard
- [ ] Parent dashboard view (accessible from main account settings)

### Game 1: Specimen Collector (build with Game 5)
- [ ] Card design: mineral name, image, family/group, Mohs hardness bar, key property, Ontario locality, rarity tier (Common/Uncommon/Rare/Legendary), flavour line
- [ ] Collection grid UI — owned cards + locked silhouettes with ? hints
- [ ] Collection stats and shareable collection link
- [ ] Unlock mechanics: daily reward (C 60% / U 25% / R 13% / L 2%, no duplicates), real find logging, game achievements, site visit bonus card, 7-day streak
- [ ] Real find logging as primary citizen science engine — log mineral X → unlock card for mineral X

### Game 4: Dig Site Simulator (build third)
- [ ] Cross-section tap mechanic — chip through labelled layers to find specimens
- [ ] Standard sites: Bancroft Marble Quarry, Thunder Bay Lakeshore, Haliburton Pegmatite, Sudbury Mafic Zone, Shield Granite
- [ ] Geologically accurate mineral drops per site (no amethyst in marble, no sodalite in basalt)
- [ ] Premium sites unlocked by real digby bookings — higher rare drop rates
- [ ] GET /api/junior/sites/:userId — premium site unlock status
- [ ] Age scaling: larger targets + simpler labels for 6–8, full detail for 9–12
- [ ] Entirely frontend (React state + weighted client-side random, static JSON site tables)

### Game 6: Mineral Match (build fourth)
- [ ] Memory/matching mechanic — name-to-image, property-to-mineral, locality-to-mineral
- [ ] Level 1 (6–8): 6 pairs, image ↔ name. Level 2 (8–10): 8 pairs, property ↔ mineral. Level 3 (10+): 10 pairs, locality ↔ mineral
- [ ] Daily challenge: same set for all players each day (server-side seed)
- [ ] Completion awards one Specimen Collector card from session minerals
- [ ] Entirely frontend (React state + static JSON card sets)

### Game 2: Rock Detective (build fifth — requires 20-case content library)
- [ ] Case structure: scene setting → clue reveal (3–5 clues) → 4-option deduction → resolution + explanation → card reward
- [ ] `detective_cases` collection (id, title, region, difficulty, clues[], options[], correct_id, explanation)
- [ ] Per-user case history (userId, caseId, attempts, solved, completedAt)
- [ ] 20 cases at launch covering Ontario's most findable minerals — each set at a real Ontario geological region
- [ ] Case rotation: new case unlocks every 3 days (server-side unlock date)
- [ ] Difficulty tiers: Easy (colour, basic shape), Medium (lustre, cleavage, streak), Hard (specific gravity, UV, crystal habit)
- [ ] Reward: correct first try → rare card; second try → uncommon; third → common

### Game 3: Formation Explorer (build last — **blocked until geology map is live**)
- [ ] Province unlock mechanic: answer 3 geology questions OR log a real find from that region
- [ ] Province pages: name, geological age plain-language, signature minerals, fun fact, nearby digby sites, exploration progress bar
- [ ] Per-user province unlock state (userId, provinceId, unlocked, mineralsCollected[], fieldVisit)
- [ ] Real find in a province auto-advances that province's exploration
- [ ] Site booking in a province awards "Field Explorer" stamp + "I was here" map marker
- [ ] Renders as layer on existing Mapbox geology map (same province boundaries)

## 9. Youth & Social Strategy
> Spec: digby-youth-social-strategy.docx

### No-build actions (Robin)
- [ ] Identify 3–4 creators for First Time Underground pilot (Ontario-based, genuine curiosity, good reaction content)
- [ ] Reach out to pilot creators with complimentary dig experience offer
- [ ] Start promoting "What's In Your Bag" format on digby social channels
- [ ] Stock UV lamps in shop before UV gallery launches

### Platform builds
- [ ] UV Gallery at /gallery/uv (dark background, full-bleed grid, filter by fluorescence colour)
- [ ] UV photo submission prompt in find journal
- [ ] "What's In Your Bag" flat-lay template / framing guide
- [ ] Hauls filter on find feed
- [ ] Specimen drop page at /drops/:slug (countdown, email notification, sold-out state)
- [ ] Digby Passport (digital, auto-generated on booking completion, displayable on profile) — [x] stamp auto-generation done; passport page built
- [ ] Passport physical product in gear shop
- [ ] Creator directory page on platform
- [ ] Co-branded content templates for creators

### Products
- [ ] Geology map art poster (commission design, add to shop as digital download + print)

## 10. Expert & Professional Features
> Spec: digby-expert-features-spec.docx

- [ ] Expert profile & credentialing (P.Geo, P.Eng, MSc/PhD, OGS/GSC, GIS Professional tiers)
- [ ] Community Reviewer tier (auto-granted: 50 verified finds + 90% agreement rate)
- [ ] OGS-Endorsed Reviewer tier (granted via OGS partnership)
- [ ] Expert verification dashboard (queue view, full review view, batch mode)
- [ ] Reviewer analytics (agreement rate, impact metric, streak)
- [ ] Formation-level analytics dashboard (summary, spatial heatmap, co-occurrence)
- [ ] GIS data export (GeoJSON, shapefile, CSV, GeoPackage, KML)
- [ ] Personal export (all Verified Expert users)
- [ ] Public dataset export (Community Reviewer+, anonymised)
- [ ] OGS partnership export (OGS-Endorsed Reviewer only)
- [ ] Public API v1 — design OpenAPI spec first, ship when ~500 verified finds
- [ ] Public tier endpoints (sites, minerals, provinces — no auth)
- [ ] Authenticated tier endpoints (finds query, export, formation stats, heatmap, co-occurrence)
- [ ] Verification submission endpoint (read-write key, Reviewer tier)
- [ ] API key management on expert profile page
- [ ] OpenAPI 3.0 docs at /api/v1/docs (auto-generated from FastAPI)
- [ ] Advanced map tools (polygon/radius query, UTM Zone 17N coordinates, custom layer upload, print/export)
- [ ] Field mode (GPS position, current formation display, quick-log button)
- [ ] Site condition reports (structured, expert-attributed)
- [ ] Formation notes wiki (Community Reviewer+ to edit)
- [ ] Expert discussion (threaded, credential-displayed, attached to formations/minerals/sites)
- [ ] Python SDK — v2, after API stable with real users

## 11. Senior & Legacy Features
> Spec: digby-senior-features-spec.docx

- [ ] Legacy data digitisation — structured desktop entry form (approximate dates, uncertainty fields)
- [ ] Batch CSV import with flexible column mapping and validation report
- [ ] Photo-to-record AI extraction (collection labels, notebook pages — reuses identifier vision pipeline)
- [ ] Legacy find display (historical indicator, approximate dates, radius uncertainty on map)
- [ ] Locality knowledge base (productive outcrops, seasonal notes, access, historical context)
- [ ] Knowledge attribution (contributor name + credential displayed prominently)
- [ ] Club accounts + club-attributed locality records
- [ ] Club event pages (field trips linkable to locality records and find logs)
- [ ] Desktop-first interface mode (data-dense tables, keyboard navigation, multi-panel views)
- [ ] Larger font size accessibility option
- [ ] Email digest (weekly opt-in: new finds in tracked formations, verification queue updates)
- [ ] Print-quality field cards (PDF, folds to quarter-page, geology map included)
- [ ] Printable find log sheets (with QR code for batch entry on return)
- [ ] GPS track import (GPX files, waypoints to find entries, track on geology map)
- [ ] Mentorship layer — Field Guide opt-in profiles (regions, minerals, availability)
- [ ] ArcGIS Online Feature Layer endpoint (REST, auto-updating verified finds)
- [ ] OGS automated data feed (scheduled, agreed format)
- [ ] QGIS plugin — v2, after API stable

## 12. Digby Seismic — Citizen Seismology Network
> Spec: digby-seismic-spec.docx (May 2026). **Gated — do not build before OGS conversation and legal review.**

- [!] **Legal review required before any code** — PIPEDA compliance, app store sensor data policies (Apple §5.1, Google Play), privacy policy addendum
- [!] **OGS pre-conversation required before public launch** — informal endorsement first, then proceed
- [!] **Requires native mobile app** — accelerometer background tasks not possible in web app. This is a platform jump.
- [ ] On-device event detection algorithm (iOS + Android background task): 100Hz accelerometer, high-pass filter, 0.02g threshold, 10-second event window, ~2KB event record)
- [ ] POST /api/seismic/event (authenticated, rate-limited — receives compressed event records)
- [ ] Server-side event aggregation: group events within 30-second window + 50km radius
- [ ] P-wave triangulation for source location (3+ devices required for confirmed event)
- [ ] Event classification: natural micro-seismic / probable quarry blast / unknown
- [ ] GET /api/seismic/events (public feed, filterable by bbox, date, magnitude, formation)
- [ ] GET /api/seismic/events/:id
- [ ] GET /api/seismic/stats (active sensor count, events today, coverage map)
- [ ] GET /api/seismic/export (OGS-format, Expert tier auth)
- [ ] Opt-in consent flow (strictly opt-in, plain language, lawyer-reviewed)
- [ ] Personal seismic history UI (every event contributed, map of location, stats)
- [ ] Public seismic map at /seismic (live events overlaid on geology map, classification + magnitude)
- [ ] Active sensor density heatmap on /seismic
- [ ] OGS data export pipeline (scheduled, agreed format)

## 13. Partnerships & Outreach
- [ ] **UWindsor:** Send email to Alice Grgicak-Mannion (grgica3@uwindsor.ca) — drafted, ready to send
- [ ] **Professor Blackburn:** Write a personal letter — not a pitch, a genuine note from a former student. digby is the direct descendant of that field trip. (Robin writes this personally)
- [ ] **OGS:** Identify correct contact in OGS Resident Geologist Program
- [ ] Send OGS partnership proposal (digby-ogs-partnership-proposal.docx) — fill in [Last Name], [email], [phone] before sending
- [ ] OGS introductory call (30 min, no commitment) → internal review → follow-up on data-sharing framework
- [ ] Follow up UWindsor for OGS introduction if relevant
- [ ] Canadian Mineralogist — potential editorial connection via academic partnerships
- [ ] Digby Seismic: add to OGS conversation as "building toward" item, not in v1 proposal

---

## Pending Decisions
| Decision | Options | Status |
|---|---|---|
| Image storage | Cloudflare R2 or S3 | Undecided |
| Shipping | Canada Post API or flat-rate $12.99 CAD | Undecided |
| OGS data first export timeline | Q1 2027 target | Pending partnership |
| API launch threshold | ~500 verified finds suggested | Pending |
| QGIS plugin | v2 after API stable | Deferred |
| Offline map caching | Design v1, ship v2 | Deferred |
| Digby Seismic mobile platform | Requires native app (iOS + Android) | Future — legal + OGS first |

---

## Ideas Parking Lot (not yet specced)
- Seasonal find calendar (what to hunt by month + site accessibility)
- "Worth keeping?" valuation guide
- Rock identification (host rock, not just minerals)
- Batch mineral identification (tray of specimens)
- Streak / hardness test interactive guides
- AR overlay (long-term: point camera at outcrop, get formation overlay)
- Specimen marketplace at /specimens (placeholder exists)
- Citizen science formal dataset release / academic paper (long-term)
- Digby Seismic v2: formal OGS partnership, native app, public seismic map

---
_To update: Claude Code edits status markers and adds completion notes. To discuss: hand back to Claude (chat)._
