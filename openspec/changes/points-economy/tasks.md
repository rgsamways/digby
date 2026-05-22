# Tasks: Points Economy (Round 1)

## Backend
- [x] Import HuntProgress in passport.py
- [x] Add points constants (STAMP_POINTS=25, MINERAL_POINTS=10, HUNT_POINTS=100)
- [x] Add `_compute_points()` helper
- [x] Update `/me` to fetch hunt completions and return `total_points`, `hunt_completions`
- [x] Update `/{visitor_id}` similarly
- [x] Add `GET /leaderboard` endpoint (before `/{visitor_id}`)

## Frontend
- [x] Add `total_points`, `hunt_completions` to PassportData interface in types.ts
- [x] Add `LeaderboardEntry` interface in types.ts
- [x] Show points total prominently in passport header
- [x] Add leaderboard query + section in passport page

## Spec
- [ ] Update openspec/specs/passport.md to document points economy
