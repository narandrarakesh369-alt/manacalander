# Mana Calendar 2027 — Supabase Edge Functions Architecture

This directory houses Supabase Edge Functions (Deno runtime) for secure server-side logic.

## Planned Function Endpoints (Phase 4 & Phase 5)

1. `payments-webhook`:
   - Validates Razorpay / payment gateway HMAC-SHA256 signatures.
   - Verifies subscription lifecycle updates.
   - Never expose payment secrets to the browser.

2. `campaign-dispatcher`:
   - Enforces the 10 included campaigns/year limit server-side.
   - Restricts push notifications to Premium plan subscribers.

3. `panchangam-sync`:
   - Pre-computes and caches ephemeris and astrological details for Andhra Pradesh & Telangana regions.
