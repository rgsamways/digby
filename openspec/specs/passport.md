# Spec: Passport & Badges

## Overview
Gamification layer. Visitors earn passport stamps for each completed booking and scavenger hunt. Stamps and hunts accumulate into a points score; milestones unlock badges.

## Stamp Creation
- Auto-triggered when an operator marks a booking `completed`
- Also triggered when a scavenger hunt is fully completed (see hunts spec)
- One stamp per completed booking
- Stamp records: site visited, minerals found, date, booking ID

## Badge Milestones
- Defined thresholds (e.g. 1, 5, 10, 25 sites visited)
- Badges awarded automatically when stamp count crosses a threshold
- Displayed on visitor passport page

## Points Economy (Round 1)

### Formula
| Activity | Points |
|---|---|
| Completed site visit (stamp) | 25 pts |
| Unique mineral found (first time ever) | 10 pts each |
| Scavenger hunt completed | 100 pts |

Points are computed on the fly — no stored field. Formula:
```
total = stamps × 25 + unique_minerals × 10 + completed_hunts × 100
```

### API
- `GET /api/passport/me` — includes `total_points`, `hunt_completions`
- `GET /api/passport/leaderboard` — public, top 10 visitors by points
  - Route registered BEFORE `/{visitor_id}` to avoid path conflict

### Display
- Points total shown prominently on passport page (gold pill)
- Breakdown line: "N visits · N minerals · N hunts"
- Public leaderboard at bottom of passport page (top 10, medal icons for top 3)

## Key Files
- `backend/app/models/passport_stamp.py` — PassportStamp document
- `backend/app/api/routes/passport.py` — `/api/passport` — get visitor stamps, badges, points, leaderboard
- `backend/app/api/routes/bookings.py` — stamp creation side effect on completion
- `backend/app/api/routes/hunts.py` — stamp creation on hunt completion
- `frontend/app/passport/` — Passport page (stamps + badges + points + leaderboard)

## Yield Reports
- Visitors can log mineral finds via `/api/yield-reports`
- Associated with site + visit date
- Separate from passport stamps but feeds into site discovery data
- See `specs/yield-reports.md`
