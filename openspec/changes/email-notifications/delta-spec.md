# Delta Spec: Email Notifications

Updates to `specs/payments.md` and `specs/bookings.md` when shipped.

## payments.md additions
- New section: **Transactional Email**
  - Provider: Resend
  - From: `bookings@digby.rocks`
  - Visitor confirmation and operator notification sent on `payment_intent.succeeded`
  - `RESEND_API_KEY` env var

## bookings.md additions
- Cancellation sends email notice to both visitor and operator
