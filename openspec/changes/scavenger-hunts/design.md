# Design: Scavenger Hunts

## Data Model

### ScavengerHunt (new Beanie document)
```python
class HuntItem(BaseModel):
    id: str                  # uuid, stable identifier
    label: str               # e.g. "Purple amethyst cluster"
    hint: str = ""           # optional clue, e.g. "Check near the creek bed"
    points: int = 10         # points awarded for finding this item

class ScavengerHunt(Document):
    site_id: PydanticObjectId
    operator_id: PydanticObjectId
    title: str               # e.g. "The Purple Trail"
    description: str = ""
    items: list[HuntItem]
    is_active: bool = True
    created_at: datetime
    
    class Settings:
        name = "scavenger_hunts"
        indexes = ["site_id", "operator_id"]
```

### HuntProgress (new Beanie document)
Tracks a visitor's progress on a specific hunt tied to a booking.
```python
class HuntProgress(Document):
    hunt_id: PydanticObjectId
    booking_id: PydanticObjectId
    visitor_id: PydanticObjectId
    site_id: PydanticObjectId
    found_item_ids: list[str] = []   # list of HuntItem.id values
    completed_at: datetime | None = None
    stamp_awarded: bool = False

    class Settings:
        name = "hunt_progress"
        indexes = ["hunt_id", "booking_id", "visitor_id"]
```

## API Routes (`/api/hunts`)

### Operator endpoints
- `POST /api/hunts/` — create hunt for a site
- `GET /api/hunts/my` — list operator's hunts
- `PUT /api/hunts/{hunt_id}` — update hunt (title, items, active state)
- `DELETE /api/hunts/{hunt_id}` — delete hunt

### Visitor endpoints
- `GET /api/hunts/site/{site_id}` — get active hunt for a site (requires confirmed booking for that site)
- `POST /api/hunts/{hunt_id}/progress` — create a progress record for a booking
- `PATCH /api/hunts/{hunt_id}/progress/{booking_id}` — mark items found (body: `{ "found_item_ids": [...] }`)

## Completion Logic
When `found_item_ids` length equals `hunt.items` length:
1. Set `HuntProgress.completed_at = now()`
2. If not already awarded: create a `PassportStamp` with `minerals_found = [item.label for item in hunt.items]` and a note indicating hunt completion
3. Set `stamp_awarded = True`

## Frontend Pages

### Operator dashboard addition
New section in `/dashboard` — "Scavenger Hunts" — list of hunts with create/edit/toggle active.

### Hunt builder (`/dashboard/hunts/new` and `/dashboard/hunts/[id]/edit`)
Form to set title, description, and add/remove/reorder items (label, hint, points).

### Visitor hunt page (`/sites/[id]/hunt`)
- Shows hunt title, description, and item checklist
- Only accessible to visitors with a confirmed or completed booking for that site
- Check off items in real time (optimistic update, PATCH on each check)
- Progress bar showing X/Y items found
- Celebration state when all items found

## Access Control
- Only operators can create/edit/delete their own hunts
- Visitors can only see/interact with hunts for sites they have a confirmed booking for
- `HuntProgress` is one-per-booking (visitors can repeat the hunt on a future booking)

## Points (Phase 2)
`HuntItem.points` is stored but not surfaced in UI yet — reserved for the points/rewards system.
