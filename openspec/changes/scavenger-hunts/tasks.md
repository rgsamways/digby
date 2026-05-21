# Tasks: Scavenger Hunts

## Backend
- [ ] Create `backend/app/models/scavenger_hunt.py` — `ScavengerHunt` and `HuntItem` documents
- [ ] Create `backend/app/models/hunt_progress.py` — `HuntProgress` document
- [ ] Register both models in `database.py` Beanie init
- [ ] Create `backend/app/api/routes/hunts.py` with all operator + visitor endpoints
- [ ] Register hunts router in `main.py` at `/api/hunts`
- [ ] Add completion logic: award passport stamp when all items found

## Frontend — Operator
- [ ] Add "Scavenger Hunts" section to `/dashboard/page.tsx` with hunt list and create button
- [ ] Create `/dashboard/hunts/new/page.tsx` — hunt builder form
- [ ] Create `/dashboard/hunts/[id]/edit/page.tsx` — edit existing hunt
- [ ] Add toggle active/inactive per hunt in the dashboard list

## Frontend — Visitor
- [ ] Create `/sites/[id]/hunt/page.tsx` — hunt checklist page
- [ ] Add "View Hunt" link on site detail page if an active hunt exists
- [ ] Checklist with real-time check-off (optimistic update)
- [ ] Progress bar and completion celebration state

## Types & API client
- [ ] Add `ScavengerHunt`, `HuntItem`, `HuntProgress` to `frontend/lib/types.ts`
- [ ] Add hunt API calls to `frontend/lib/api.ts` if needed

## Testing
- [ ] Create a hunt as operator, verify it appears on the site detail page
- [ ] Book a site, view the hunt, check off all items, verify passport stamp is awarded
