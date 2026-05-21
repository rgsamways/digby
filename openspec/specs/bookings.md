# Spec: Bookings

## Overview
Visitors book available date slots on sites. Bookings are linked to a Stripe payment intent. Group bookings allow multiple named members on a single booking.

## Booking Lifecycle
1. Visitor selects site + date + party size
2. Frontend creates booking → backend creates Stripe PaymentIntent
3. Visitor completes Stripe payment flow
4. Webhook confirms payment → booking status set to `confirmed`
5. Operator marks booking `completed` after visit
6. On completion, passport stamp auto-created for visitor

## Statuses
- `pending` — created, payment not yet confirmed
- `confirmed` — payment succeeded
- `cancelled` — cancelled by visitor or operator
- `completed` — visit occurred, operator marked complete

## Group Bookings
- A booking can include multiple `group_members` (names + optional emails)
- Each group member can be added/updated via `/api/bookings/{id}/members`
- All members share the same booking and payment

## Key Files
- `backend/app/models/booking.py` — Booking document, group member sub-model
- `backend/app/api/routes/bookings.py` — CRUD, cancel, complete, group member endpoints
- `backend/app/api/routes/availability.py` — slot management per site per date
- `backend/app/models/availability.py` — `slots_remaining`, `is_blocked` per date
- `frontend/app/bookings/` — My Bookings page, booking confirmation
- `frontend/components/BookingForm.tsx` — Date picker, party size, Stripe Elements

## Availability Rules
- Each date has `slots_remaining`; booking decrements it
- Operators can block dates entirely (`is_blocked = true`)
- Cancellation restores `slots_remaining`

## Passport Stamp Side Effect
- Completing a booking auto-creates a `PassportStamp` for the visitor
- See `specs/passport.md`
