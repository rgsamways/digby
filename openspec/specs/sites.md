# Spec: Sites

## Overview
Operators list rockhound sites with location, minerals, pricing, and availability. Visitors discover sites via map or list view with geospatial filtering.

## Site Fields
- `name`, `description`, `site_type` (dig, surface, guided, etc.)
- `location` — GeoPoint (lat/lng) with MongoDB 2dsphere index
- `minerals` — list of findable minerals (e.g. ["amethyst", "calcite"])
- `price_per_person` — CAD, per visitor per visit
- `max_capacity` — max party size per booking
- `is_active` — visible to visitors only when true
- `operator_id` — FK to User (OPERATOR role)

## Discovery
- Geospatial search: `/api/sites?lat=&lng=&radius_km=`
- Filter by mineral, site type, price range
- Map view uses Mapbox GL (`frontend/components/Map.tsx`)

## Key Files
- `backend/app/models/site.py` — Site document, GeoPoint sub-model
- `backend/app/api/routes/sites.py` — list, get, create, update, delete
- `frontend/app/sites/` — discovery page (map + list), site detail page
- `frontend/components/Map.tsx` — Mapbox integration
- `frontend/components/SiteCard.tsx` — site preview card

## Operator Rules
- Only OPERATOR or ADMIN can create/update/delete sites
- `require_operator` dependency enforces this
- Operators can only modify their own sites (except ADMIN)

## Related Specs
- `specs/bookings.md` — booking a site
- `specs/weather-alerts.md` — site condition alerts
- `specs/yield-reports.md` — mineral find reports per site
