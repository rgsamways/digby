# Spec: Authentication

## Overview
JWT-based auth. Tokens are issued on login/register and validated on every protected route via FastAPI dependency injection.

## Roles
- `VISITOR` — browse and book sites
- `OPERATOR` — list and manage sites, view bookings
- `GUIDE` — offer guided tours, manage guide bookings
- `ADMIN` — platform administration

## Token Details
- Algorithm: HS256
- Expiry: 10080 minutes (7 days)
- Secret: `JWT_SECRET` env var (64-char hex string)

## Key Files
- `backend/app/core/security.py` — password hashing (bcrypt), JWT create/verify
- `backend/app/api/deps.py` — `get_current_user`, `require_operator` dependencies
- `backend/app/api/routes/auth.py` — `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- `backend/app/models/user.py` — User document with role enum, Stripe account IDs

## Stripe Connect Fields on User
- `stripe_account_id` — operator's connected Stripe account
- `stripe_account_enabled` — whether payouts are active

## Constraints
- Passwords hashed with bcrypt before storage
- Tokens are stateless (no server-side session store)
- CORS origins controlled by `BACKEND_CORS_ORIGINS` env var
