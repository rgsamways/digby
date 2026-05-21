# Design: Email Notifications via Resend

## Architecture
Emails send from the backend only, triggered inside the Stripe webhook handler and the cancel endpoint. No frontend involvement.

## Resend Integration
- Package: `resend` (PyPI)
- Config: `RESEND_API_KEY` env var via `config.py`
- From address: `bookings@digby.rocks` (requires verified domain in Resend)
- Sending: synchronous `resend.Emails.send()` call — acceptable latency inside webhook handler

## Trigger Points

### 1. `payment_intent.succeeded` webhook (`payments.py`)
After `booking.set({status: CONFIRMED})`:
- Fetch visitor (`User.get(booking.visitor_id)`)
- Fetch operator (`User.get(booking.operator_id)`)
- Fetch site (`Site.get(booking.site_id)`)
- Send visitor confirmation email
- Send operator new booking email

### 2. `cancel_booking` endpoint (`bookings.py`)
After `booking.set({status: CANCELLED})`:
- Fetch visitor + operator
- Send cancellation notice to both

## Email Content

### Visitor Confirmation
```
Subject: Your Digby booking is confirmed — {site_name}

Hi {visitor_name},

Your booking is confirmed!

Site: {site_name}
Date: {date}
Party size: {party_size}
Total paid: ${total_amount} CAD

See you at the dig!
— The Digby team
```

### Operator New Booking
```
Subject: New booking for {site_name} on {date}

Hi {operator_name},

You have a new confirmed booking.

Site: {site_name}
Date: {date}
Party size: {party_size}
Payout: ${operator_payout} CAD

Log in to your dashboard to view details.
— The Digby team
```

### Cancellation (both parties)
```
Subject: Booking cancelled — {site_name} on {date}

Hi {name},

A booking for {site_name} on {date} (party of {party_size}) has been cancelled.

— The Digby team
```

## Error Handling
Wrap each `resend.Emails.send()` in a try/except. A failed email must never cause the webhook to return non-200 — Stripe would retry and double-process the booking.

## New Files
None — changes are additions to existing route files.

## Changed Files
- `backend/app/core/config.py` — add `RESEND_API_KEY`
- `backend/app/api/routes/payments.py` — send emails after confirmation
- `backend/app/api/routes/bookings.py` — send cancellation emails
- `backend/pyproject.toml` — add `resend` dependency
- `.env.example` — add `RESEND_API_KEY`
