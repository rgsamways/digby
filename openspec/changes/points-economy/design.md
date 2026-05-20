# Design: Points Economy (Round 1)

## Points Formula

| Activity | Points |
|---|---|
| Completed site visit (passport stamp) | 25 pts |
| Unique mineral found (first time ever across all visits) | 10 pts each |
| Scavenger hunt completed | 100 pts |

Points are computed on the fly from existing collections — no new model needed.

```
total = len(stamps) × 25
      + len(unique_minerals) × 10
      + count(HuntProgress where completed_at != null and visitor_id = me) × 100
```

## API Changes

### `GET /api/passport/me` — add to response
```json
{
  "total_points": 175,
  "hunt_completions": 1,
  ...existing fields
}
```

### `GET /api/passport/leaderboard` — new endpoint (public, no auth)
Returns top 10 visitors by total points.
```json
[
  { "name": "Robin", "points": 275, "visits": 3 },
  ...
]
```
Route must be registered BEFORE `/{visitor_id}` to avoid path conflict.

## Frontend Changes

- `types.ts` — add `total_points: number`, `hunt_completions: number` to PassportData; add `LeaderboardEntry` interface
- `passport/page.tsx` — show points total in header area (gold, prominent); add Leaderboard section below stamps
