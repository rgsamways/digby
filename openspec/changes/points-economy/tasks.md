# Tasks: Points Economy (Round 1)

## Backend
- [ ] Import HuntProgress in passport.py
- [ ] Add points constants (STAMP_POINTS=25, MINERAL_POINTS=10, HUNT_POINTS=100)
- [ ] Add `_compute_points()` helper
- [ ] Update `/me` to fetch hunt completions and return `total_points`, `hunt_completions`
- [ ] Update `/{visitor_id}` similarly
- [ ] Add `GET /leaderboard` endpoint (before `/{visitor_id}`)

## Frontend
- [ ] Add `total_points`, `hunt_completions` to PassportData interface in types.ts
- [ ] Add `LeaderboardEntry` interface in types.ts
- [ ] Show points total prominently in passport header
- [ ] Add leaderboard query + section in passport page

## Spec
- [ ] Update openspec/specs/passport.md to document points economy
