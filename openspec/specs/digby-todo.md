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
- [ ] Admin session auth — ADMIN_PASSWORD env var, session cookie on /admin routes
- [ ] Product list view (paginated, name / category / price / stock / active)
- [ ] Create / edit product form — all fields: name, slug (auto-generated, editable), category + subcategory dropdowns, description, price + cost (display as dollars), SKU, supplier, stock, dropship toggle, active toggle, tags multi-input, related_products selector, site_recommendations selector
- [ ] Image upload — stub as TODO until R2/S3 is decided
- [ ] Soft delete / deactivate product (active: false)
- [ ] Order list view (status, total, customer, date)
- [ ] Order detail view (line items, shipping address, Stripe payment ID, status)
- [ ] Manual order status update (pending → confirmed → fulfilled → shipped → cancelled)

## 3. Digby Strata — Subscription Box
> Spec: digby-strata-spec.docx (May 2026). **Bancroft Gemboree deadline: August 1, 2026.**
- [ ] StrataSubscription Beanie model (tier, billing_frequency, status, subscriber_id, stripe_subscription_id)
- [ ] Box model (month number, theme, contents list, field_card_text, formation_map_url, shipped_at)
- [ ] CollectorCardCode model (code, mineral_id, box_id, redeemed_by, redeemed_at)
- [ ] Stripe Billing integration (recurring subscriptions — different from existing PaymentIntents)
- [ ] POST /api/strata/subscribe (create Stripe subscription + subscriber record)
- [ ] GET /api/strata/my (subscriber portal data: tier, status, box history)
- [ ] PATCH /api/strata/my (update tier, pause, update address)
- [ ] DELETE /api/strata/my (cancel — easy, no dark patterns)
- [ ] POST /api/strata/gift (purchase gift subscription for a named recipient)
- [ ] GET /api/strata/redeem/:code (validate collector card code, unlock digital card if valid)
- [ ] /strata sign-up page — tier selection (Discoverer $39 / Collector $59 / Geologist $89), billing frequency, shipping address
- [ ] /strata/archive — every past box: contents, field card text, formation map, dig site links, individual specimens in shop
- [ ] Subscriber portal (manage tier, pause, update address, box history)
- [ ] Gift subscription flow with delivery date
- [ ] Cancellation and pause flows (easy, no dark patterns)
- [ ] Annual prepay discount option (10% off)
- [ ] Admin tools: subscriber list, box fulfilment status, shipping label export
- [ ] Collector card UTM tracking — measure booking conversions from Strata subscribers

## 4. Geology Map Overlay
> Spec: Claude Code Handoff Document (Section 2, May 2026)
- [ ] **Manual step (Robin):** Download OGS shapefiles from geohub.lio.gov.on.ca — Bedrock Geology, MDI, Past Producing Mines
- [ ] **Manual step (Robin):** Upload shapefiles to Mapbox Studio as tilesets, note tileset IDs (format: yourusername.xxxxxxxx)
- [ ] **Manual step (Robin):** Inspect each tileset in Mapbox Studio feature inspector — note exact field names for formation name, rock type, geological province, age (bedrock); mineral type, deposit name (MDI); mine name, commodity (past mines)
- [ ] Add tileset IDs to env config (MAPBOX_TILESET_BEDROCK, MAPBOX_TILESET_MINERAL_OCCURRENCES, MAPBOX_TILESET_PAST_MINES)
- [ ] GET /api/map/sites — GeoJSON FeatureCollection of bookable digby sites (id, name, slug, coordinates, findable minerals, thumbnail)
- [ ] /map page with full-screen Mapbox map + collapsible sidebar
- [ ] Bedrock geology layer (hover/click: formation name, age, rock type, mineral associations)
- [ ] Mineral occurrences layer (filterable by mineral type — checkbox/multi-select)
- [ ] Digby sites layer (custom markers, click popup: site name, minerals, book CTA)
- [ ] Past producing mines layer (optional toggle, low visual prominence)
- [ ] Layer toggle panel (sidebar or floating)
- [ ] Mobile: sidebar collapses to bottom drawer or floating button
- [ ] Geological province blurbs in sidebar (plain-language, rockhound-relevant: Grenville, Superior, Southern Province, etc.)
- [ ] Default view centred on Ontario

## 5. AI Mineral Identifier — Upgrade
> Spec: digby-identifier-upgrade.docx
- [ ] Review existing bare-bones implementation before rebuilding anything
- [ ] Multi-photo input (up to 4 images)
- [ ] Optional context fields (location, host rock type, UV behaviour)
- [ ] Claude claude-sonnet-4-20250514 vision API with structured JSON response schema
- [ ] Confidence scoring (high / medium / low) with plain-language framing
- [ ] Visual clues breakdown ("why we think so")
- [ ] Differential diagnosis (up to 3 alternatives with practical field tests)
- [ ] Ontario geological context (province, formation, digby site links)
- [ ] Physical properties reference card
- [ ] Specimen quality assessment
- [ ] UV fluorescence guidance
- [ ] One-tap log to find journal (pre-populated)
- [ ] Image compression client-side (max 1200px, JPEG 85)
- [ ] HEIC to JPEG conversion server-side
- [ ] EXIF stripping before API call
- [ ] Rate limiting (10/day free, unlimited registered)
- [ ] Result caching by image hash
- [ ] POST /api/identify route
- [ ] Ontario mineral reference JSON (Grenville, Superior, Sudbury, widespread species)
- [ ] Verification status system (unverified / AI-likely / community-verified / expert-verified / disputed)
- [ ] User correction flow ("disagree with this ID")

## 6. Find Journal + Citizen Science
> OGS partnership proposal commits this to Q3 2026.
- [ ] Find journal data model (location, date, site, mineral ID, formation, specimen quality, photos, notes, visibility, verification status)
- [ ] Verification pipeline: AI-likely → community-verified → OGS-reviewed (three tiers — must match OGS proposal exactly)
- [ ] Formation auto-population from GPS coordinates vs OGS bedrock layer
- [ ] Private find journal UI (log, browse, edit)
- [ ] Public find feed (full-bleed, filterable) — foundation for Youth & Social strategy
- [ ] Individual find page at /finds/:id with open graph meta
- [ ] Save/bookmark mechanic on find feed
- [ ] Weekly featured finds (curation flag)
- [ ] Citizen science quality criteria check (GPS + photo + AI-likely+ + host rock + opted in)
- [ ] Citizen science status surfaced to user as achievement
- [ ] Junior find logging (flagged as junior_submission, parent opt-in for citizen science)
- [ ] GET /api/finds/feed (paginated, filterable public feed)
- [ ] POST /api/finds (create find)
- [ ] GET /api/finds/:id
- [ ] POST /api/finds/:id/save
- [ ] OGS citizen science data export (GPS, date, mineral ID, formation match, host rock, verification status, photo, site context)

## 7. GIS Education Content
> Spec: Claude Code Handoff Document (Section 3, May 2026). Sample content for Lesson 1 (GIS) and Lesson 2 (Field) already written in spec.
- [ ] /learn landing page — track selection, overview
- [ ] **Field Track** — 5 lessons, no software required, 5-minute reads, "Try it" prompts linked to digby map
  - [ ] Lesson 1: How Ontario's geology formed (deep time, plain language)
  - [ ] Lesson 2: Ontario's mineral regions — the four provinces and what makes each distinct *(sample content written in spec)*
  - [ ] Lesson 3: Reading a geological map — formations, contacts, symbols
  - [ ] Lesson 4: Crown land, mineral rights, and site access
  - [ ] Lesson 5: Planning a trip using the digby map
- [ ] **GIS Track** — 5 lessons, QGIS-based, hands-on OGS data
  - [ ] Lesson 1: Installing QGIS and loading your first Ontario geology layer *(sample content written in spec)*
  - [ ] Lesson 2: Querying and filtering OGS data ("show me all pegmatite occurrences in Eastern Ontario")
  - [ ] Lesson 3: Overlaying topo maps and satellite imagery
  - [ ] Lesson 4: Exporting a field map to your phone
  - [ ] Lesson 5: From map to site — planning a digby trip with spatial analysis
- [ ] Lessons reference real digby sites throughout
- [ ] Field Track lessons link to relevant booking pages
- [ ] GIS Track exercises use real OGS data for Ontario

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
