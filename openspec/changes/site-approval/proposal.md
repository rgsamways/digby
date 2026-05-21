# Proposal: Site Approval / Manual Review Gate

## What
New sites start in `pending_review` status and are invisible to visitors until an admin approves them. Discovery, search, and booking endpoints filter to `active` sites only.

## Why
Prevents bad-faith listings with no intent to offer real bookings. Also protects visitors from booking sites that don't actually exist or where the operator has no land access rights.

## Approach
1. Add `status: "pending_review" | "active" | "suspended"` to Site model (default `pending_review`)
2. Filter all public-facing site queries to `status == "active"`
3. Operator can still see their own pending sites in the dashboard
4. Admin endpoint: `PATCH /api/admin/sites/{id}/approve` — sets status to `active`
5. Pair with Stripe Connect gate already in place (no bank account = no payouts anyway)

## Out of scope (this ticket)
- Email notification to operator on approval
- Rejection workflow with reason
- Admin UI (can use the API directly for now)
