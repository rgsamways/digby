# Spec: Payments

## Overview
Stripe Connect (Express accounts) handles operator payouts. Platform takes 12% of each booking; operator receives 88%. All payment events flow through a Stripe webhook.

## Key Numbers
- Platform fee: `STRIPE_PLATFORM_FEE_PERCENT` env var (default 12%)
- Operator share: 88%

## Flow
1. Visitor pays via Stripe Elements (frontend `BookingForm.tsx`)
2. Backend creates PaymentIntent with `application_fee_amount` calculated from platform fee
3. On `payment_intent.succeeded` webhook → booking confirmed
4. Funds split automatically by Stripe Connect: operator receives their share, platform retains fee

## Operator Onboarding
- Operators connect a Stripe Express account via OAuth flow
- `stripe_account_id` and `stripe_account_enabled` stored on User document
- Operators without an enabled Stripe account cannot receive bookings

## Webhook Events Handled
- `payment_intent.succeeded` — confirm booking
- `payment_intent.payment_failed` — mark booking failed
- `account.updated` — sync operator Stripe account status

## Key Files
- `backend/app/api/routes/payments.py` — webhook handler, Stripe Connect OAuth
- `backend/app/core/config.py` — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PLATFORM_FEE_PERCENT`
- `frontend/components/BookingForm.tsx` — Stripe Elements integration
- `frontend/lib/api.ts` — payment intent creation API call

## Security
- Webhook signature verified via `STRIPE_WEBHOOK_SECRET` before processing
- Never log or store raw card data
