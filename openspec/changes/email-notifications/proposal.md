# Proposal: Email Notifications via Resend

## Problem
No transactional emails are sent at any point in the booking flow. Visitors have no confirmation after paying. Operators have no notification when a new booking arrives.

## Proposed Solution
Integrate Resend for transactional email. Trigger emails from the Stripe webhook handler when a booking is confirmed. Add a second trigger when a booking is cancelled.

## Emails in Scope
1. **Visitor booking confirmation** — sent when booking status → `confirmed`
2. **Operator new booking notification** — sent at the same moment
3. **Cancellation notice** — sent to both parties when booking status → `cancelled`

## Out of Scope
- HTML email templates (plain text first, templates later)
- Email preferences / unsubscribe
- Guide booking emails (separate feature)
