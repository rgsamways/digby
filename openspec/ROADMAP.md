# Digby Feature Roadmap — Cross-Reference Map

## The Flywheel

Every feature feeds into at least two others. The goal is a self-reinforcing loop:
**Discovery → Booking → Experience → Content → Discovery**

```
[Site Discovery] ←──────────────────────────────────────────┐
      │                                                       │
      ↓                                                       │
[Booking] → [Post-Visit Prompt] → [Dig Diary Entry]          │
      │              │                    │                   │
      │              │              minerals_found            │
      │              │                    │                   │
      ↓              ↓                    ↓                   │
[Passport] ← [Points Economy] ← [AI Mineral ID] → [Field Guide]
      │              ↑                    ↑                   │
      │         [Quiz] ─────────── mineral knowledge          │
      │                                                       │
      ↓                                                       │
[Seasonal Alerts] ────── visitor wishlist ──────────────────→┘
```

## Feature Build Order (each builds on the last)

### Round 1 — The Content Engine
1. **Dig Diary** — post-visit field journal, public feed, social proof on site pages
   - Adds: diary_entries to passport, +15pts per public entry
   - Feeds: site social proof, community feed, minerals to passport

2. **AI Mineral ID** — photo → Claude vision → mineral identification
   - Adds: standalone tool + integrated into diary entry flow
   - Feeds: diary minerals, passport minerals, site rarity data, +25pts first-time species

3. **Reviews & Ratings** — post-visit star rating + text, feeds site.rating field
   - Adds: booking conversion trust signal
   - Feeds: site discovery sort order, site detail page

### Round 2 — The Discovery Engine  
4. **Field Guide** — mineral encyclopedia
   - Each mineral page: description, identifying features, Ontario localities
   - Feeds: links to sites, links to diary entries, links to quiz questions
   - Generated from existing mineral data in sites + diary + quiz bank

5. **Seasonal Hunt Alerts** — operator sets optimal months, visitor sets wishlist
   - Adds: harvest_windows to Site, mineral_wishlist to User
   - Feeds: "in season now" discovery filter, email alerts (via Resend when live)

### Round 3 — The Demand Engine
6. **Mystery Booking** — pick province + mineral preference → surprise site
   - Uses: existing booking/payment/availability stack
   - Feeds: operator slow-date revenue, visitor delight, repeat bookings

7. **Specimen Marketplace** — buy specimens without visiting
   - Separate product, needs shipping/fulfilment design
   - Feeds: operator year-round revenue

## Cross-Reference Matrix

| Feature | → Passport | → Site Page | → Points | → Feed | → Email |
|---|---|---|---|---|---|
| Dig Diary | entries count | "From the Field" section | +15 per entry | public feed | — |
| AI Mineral ID | minerals found | rarity index | +25 first species | — | — |
| Reviews | — | star rating, trust | +10 per review | — | — |
| Field Guide | — | mineral links | — | — | — |
| Seasonal Alerts | wishlist display | harvest windows | — | — | ✓ Resend |
| Quiz | sessions count | — | existing | — | — |
| Scavenger Hunt | stamps | hunt banner | existing | — | — |

## Point Values (complete economy)

| Activity | Points |
|---|---|
| Completed site visit (stamp) | 25 |
| Unique mineral found (first time) | 10 |
| Scavenger hunt completed | 100 |
| Quiz correct answer | 5 |
| Quiz perfect score bonus | 25 |
| Dig diary entry (public) | 15 |
| First time identifying a new species via AI | 25 |
| Leaving a site review | 10 |
