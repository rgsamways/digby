# Tasks: Email Notifications via Resend

## Setup
- [ ] Add `resend` to `backend/pyproject.toml` dependencies
- [ ] Add `RESEND_API_KEY: str = ""` to `config.py`
- [ ] Add `RESEND_API_KEY=` to `.env.example`
- [ ] Verify `bookings@digby.rocks` domain in Resend dashboard

## Backend
- [ ] Add `send_booking_confirmation(booking, visitor, operator, site)` helper in `payments.py`
- [ ] Add `send_operator_notification(booking, visitor, operator, site)` helper in `payments.py`
- [ ] Call both helpers in `payment_intent.succeeded` webhook handler after status update
- [ ] Add `send_cancellation_notice(booking, visitor, operator, site)` helper in `bookings.py`
- [ ] Call cancellation helper in `cancel_booking` endpoint after status update
- [ ] Wrap all `resend.Emails.send()` calls in try/except so email failure never breaks the webhook

## Deploy
- [ ] Add `RESEND_API_KEY` to Railway `digby` service variables
- [ ] Test end-to-end: complete booking → check visitor + operator inboxes
- [ ] Test cancellation flow → check both inboxes
