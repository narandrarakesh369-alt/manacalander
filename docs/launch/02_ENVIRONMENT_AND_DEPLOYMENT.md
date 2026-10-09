# Mana Calendar 2027 — Environment & Deployment Specification

**Target Domain:** `https://manacalendar.in`  
**SSL Provider:** Cloudflare / Let's Encrypt (Strict TLS 1.3)  
**Security Rating:** Grade A+ (HSTS Enabled, Content-Security-Policy, CORS Restrictive)  

---

## 1. Environment Separation Architecture

Three distinct environments are maintained with isolated databases, buckets, and API credentials:

```
+-----------------------------------------------------------------------------+
|                               ENVIRONMENT TIERS                             |
+---------------------+-------------------------------+-----------------------+
| DEVELOPMENT         | STAGING                       | PRODUCTION            |
| Local Mock / Local  | staging.manacalendar.in       | manacalendar.in       |
| VITE_APP_ENV=dev    | VITE_APP_ENV=staging          | VITE_APP_ENV=prod     |
| Mock Supabase/Local | Staging Supabase DB           | Production High-Avail |
| Dev Switcher ON     | Dev Switcher OFF              | Dev Switcher OFF      |
| Test Razorpay keys  | Test Razorpay keys            | Live Razorpay keys    |
+---------------------+-------------------------------+-----------------------+
```

### Zero Secret Leakage Guarantee:
1. **Frontend Bundle (`VITE_*`):**
   * Contains *only* `VITE_APP_ENV`, `VITE_APP_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
   * The `anon` key is public-safe and strictly constrained by PostgreSQL Row Level Security.
2. **Server-Side Secrets (Never in frontend):**
   * `SUPABASE_SERVICE_ROLE_KEY` (Stored only in Supabase Vault / Edge Function environment).
   * `PAYMENT_KEY_SECRET` & `PAYMENT_WEBHOOK_SECRET` (Stored only in Edge Functions for Razorpay HMAC verification).
   * `FIREBASE_PRIVATE_KEY` (Stored only in Edge Function for FCM v1 push dispatch).
   * `WEATHER_API_KEY` (Stored only in Edge Function for upstream weather caching).

---

## 2. Production Domain Configuration (`https://manacalendar.in`)

### DNS Configuration:
* **Apex Domain:** `manacalendar.in` -> A Record -> CDN / Edge Gateway
* **Subdomain WWW:** `www.manacalendar.in` -> CNAME -> `manacalendar.in` (301 Permanent Redirect to apex)
* **API / Edge Functions:** `https://manacalendar.in/api/v1` or Supabase Edge Gateway
* **Android App Links Host:** `https://manacalendar.in/.well-known/assetlinks.json`

### HTTP Security Headers:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(), microphone=()
```

### Static Asset Caching Rules:
* `index.html` -> `Cache-Control: no-cache, no-store, must-revalidate` (Guarantees instant app updates)
* `assets/*.js`, `assets/*.css` -> `Cache-Control: public, max-age=31536000, immutable` (Hashed filenames)
* `.well-known/assetlinks.json` -> `Cache-Control: public, max-age=3600` (Fast Android verification)

---

## 3. Production Deployment Process

1. **Verify Static Cleanliness:**
   ```bash
   npx tsc --noEmit
   npx vitest run
   ```
2. **Compile Production Bundle:**
   ```bash
   npm run build
   ```
3. **Verify Output Assets:**
   * Verify `dist/index.html` exists.
   * Verify `dist/.well-known/assetlinks.json` is present.
   * Verify `dist/manifest.json` and `dist/robots.txt` are present.
4. **Deploy Web Hosting & Edge Functions:**
   ```bash
   # Deploy frontend assets to production CDN
   # Deploy Supabase Edge Functions:
   supabase functions deploy weather --project-ref <prod_ref>
   supabase functions deploy fcm-push --project-ref <prod_ref>
   supabase functions deploy razorpay-webhook --project-ref <prod_ref>
   ```
5. **Run Post-Deployment Smoke Test:**
   * Test `https://manacalendar.in/` (Customer Home)
   * Test `https://manacalendar.in/b/slj001` (Business Landing & QR Deep-Link)
   * Test `https://manacalendar.in/.well-known/assetlinks.json` (Valid JSON response)
   * Test `https://manacalendar.in/privacy` (Privacy Policy)
