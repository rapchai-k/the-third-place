# External Integrations

## Integration Inventory

| Integration | Purpose | Direction | Primary Code Touchpoints | Key Config/Secrets |
|---|---|---|---|---|
| Supabase (DB/Auth/Functions) | Core backend, auth, storage, server data | App <-> Supabase | `src/integrations/supabase/client.ts`, `src/lib/supabase/server.ts`, `proxy.ts`, `supabase/functions/*` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Razorpay | Paid event checkout + webhook settlement | App -> Razorpay and Razorpay -> App | `src/components/PaymentButton.tsx`, `supabase/functions/create-payment/index.ts`, `supabase/functions/verify-payment/index.ts`, `supabase/functions/payment-callback/index.ts` | `RZP_LIVE_KEY_ID`, `RZP_LIVE_KEY_SECRET`, `RZP_TEST_KEY_ID`, `RZP_TEST_KEY_SECRET`, `RZP_LIVE_WEBHOOK_SECRET` / `RZP_WEBHOOK_SECRET`, `RZP_BASE_URL` |
| Resend | Transactional email delivery | App -> Resend | `supabase/functions/send-email/index.ts`, `supabase/functions/welcome-email-trigger/index.ts` | `RESEND_API_KEY` |
| Google Tag Manager (feeds GA4 via GTM config) | Client analytics/event collection | Browser -> GTM | `src/components/analytics/GoogleTagManager.tsx`, `src/utils/analytics.ts`, `src/hooks/usePageTracking.ts` | `NEXT_PUBLIC_GTM_ID` |
| Google OAuth via Supabase Auth | Social sign-in | Browser -> Supabase Auth -> Google | `src/contexts/AuthContext.tsx`, `src/views/Auth.tsx`, `app/auth/callback/page.tsx` | Supabase Auth provider settings + Google OAuth credentials (configured outside repo) |
| Outbound Webhook Endpoints (user-configured) | Event fan-out to external systems | App -> External URLs | `supabase/functions/webhook-dispatcher/index.ts`, SQL-driven queueing in webhook tables/migrations | URL and secret in `webhook_configurations` table |
| WhatsApp deep link | Referral sharing UX | Browser -> `wa.me` URL | `src/hooks/useReferrals.ts` | No secret (link-based) |

## Supabase Integration (Core)

### Where It Is Wired
- Browser client initialization and env fallbacks: `src/integrations/supabase/client.ts`.
- SSR/server component client: `src/lib/supabase/server.ts`.
- Session refresh across requests: `proxy.ts`.
- Supabase project/function configuration: `supabase/config.toml`.
- Schema and policy lifecycle: `supabase/migrations/*.sql`.

### App Usage Pattern
- Server-rendered pages query public data through typed helpers in `src/lib/supabase/server.ts`.
- Client features (registration, referrals, profile actions) read/write directly using the browser client (`src/hooks/useEventRegistration.ts`, `src/hooks/useReferrals.ts`, `src/views/*`).
- Privileged operations run through edge functions using service-role clients.

### Operational Notes
- `next.config.mjs` exports public Supabase env vars to client code.
- `supabase/config.toml` marks several functions `verify_jwt = false`; those functions still perform their own auth checks where needed (for example token validation in payment functions).

## Razorpay Payment Integration

### End-To-End Flow
1. User clicks pay in `src/components/PaymentButton.tsx`.
2. Frontend invokes `create-payment` via `supabase.functions.invoke` through `src/utils/supabaseWithTimeout.ts`.
3. `supabase/functions/create-payment/index.ts` creates/reuses a `payment_sessions` row and calls Razorpay Payment Links API (`/v1/payment_links`).
4. User completes checkout on Razorpay-hosted page.
5. Razorpay sends webhook to `supabase/functions/payment-callback/index.ts` (`x-razorpay-signature` validated via HMAC).
6. Frontend polling (`verify-payment`) in `src/components/PaymentButton.tsx` confirms latest state through `supabase/functions/verify-payment/index.ts`.
7. Registration and community auto-join are upserted server-side on paid success.

### External Calls
- Outbound to Razorpay:
  - `POST ${RZP_BASE_URL}/v1/payment_links` in `supabase/functions/create-payment/index.ts`.
  - `GET ${RZP_BASE_URL}/v1/payment_links/{id}` in `supabase/functions/verify-payment/index.ts`.
- Inbound webhook from Razorpay:
  - `supabase/functions/payment-callback/index.ts`.

### Data Dependencies
- Primary tables touched include `payment_sessions`, `payment_logs`, `event_registrations`, `community_members`, and `app_settings` (see reads/writes inside payment function files).

## Resend Email Integration

### Main Paths
- Provider API call: `fetch("https://api.resend.com/emails")` in `supabase/functions/send-email/index.ts`.
- Orchestration/idempotency: `supabase/functions/welcome-email-trigger/index.ts`.
- Template management + rendering support:
  - `supabase/functions/shared/email-templates.ts`
  - `supabase/functions/manage-email-template/index.ts`
  - `supabase/functions/get-email-template/index.ts`
  - `supabase/functions/test-email-template/index.ts`
  - `supabase/functions/email-template-analytics/index.ts`

### Behavior
- `welcome-email-trigger` checks `users.welcome_email_sent_at` before sending.
- Email metadata and template tags are persisted to `email_logs` by `send-email`.
- Trigger wiring from auth/user creation is represented in migrations such as `supabase/migrations/20250823000002_update_handle_new_user_with_email.sql` and `supabase/migrations/20250823125000_fix_email_logs_and_welcome_email.sql`.

## Google Tag Manager / Analytics Integration

### Client Wiring
- GTM script and noscript snippets are injected from `src/components/analytics/GoogleTagManager.tsx` (mounted in `app/layout.tsx`).
- Tracking API abstraction is centralized in `src/utils/analytics.ts`.
- Route/page tracking is provided by `src/components/analytics/AnalyticsProvider.tsx` + `src/hooks/usePageTracking.ts`.

### Event Sources
- Auth lifecycle events in `src/contexts/AuthContext.tsx`.
- Commerce events (`begin_checkout`, `purchase`) in `src/components/PaymentButton.tsx`.
- Additional feature events call the same utility in view/hook code.

## Google OAuth Through Supabase Auth

### Integration Points
- OAuth initiation: `supabase.auth.signInWithOAuth({ provider: 'google' })` in `src/contexts/AuthContext.tsx`.
- Auth UI trigger: `src/views/Auth.tsx`.
- Callback route wrapper: `app/auth/callback/page.tsx` (renders `src/views/AuthCallback.tsx`).

### Configuration Boundary
- OAuth client credentials are managed in Supabase Auth provider settings (documented in `README.md` and `docs/development/env.md`), not in repository secrets.

## Outbound Webhook Dispatcher Integration

### Dispatcher Mechanics
- Worker endpoint: `supabase/functions/webhook-dispatcher/index.ts`.
- Selects `pending` rows from `webhook_deliveries` joined with active `webhook_configurations`.
- Sends signed POST payloads to external consumer URLs (`config.url`) with optional `X-Webhook-Signature`.
- Retries up to 3 attempts and persists response/error telemetry back to DB columns.

### Upstream Producers
- `supabase/functions/welcome-email-trigger/index.ts` posts an internal event to `webhook-dispatcher` as best effort.
- Additional producer intent and contracts are documented in `docs/api/webhooks/index.md` and related webhook docs.

## Secondary External Touchpoints
- Google Fonts CDN in `app/layout.tsx` (`fonts.googleapis.com`, `fonts.gstatic.com`).
- WhatsApp share link in `src/hooks/useReferrals.ts` uses `https://wa.me/?text=...`.
- Schema metadata in pages/utilities references `schema.org` URLs (`app/e/[shortCode]/page.tsx`, `src/utils/schema.ts`) for SEO semantics.

## Practical Runbook

### Verify Supabase Connectivity
- Confirm client env handling in `src/integrations/supabase/client.ts` and server env handling in `src/lib/supabase/server.ts`.
- Use `app/api/test-auth/route.ts` to inspect SSR auth/session behavior through `proxy.ts`.

### Verify Payments
- Check payment function config in `supabase/config.toml`.
- Validate edge function secrets from `docs/development/env.md`.
- Run paid registration path from UI (`src/components/EventRegistrationButton.tsx`) and inspect resulting rows in `payment_sessions` and `payment_logs`.

### Verify Email
- Confirm `RESEND_API_KEY` exists.
- Exercise `welcome-email-trigger` and inspect `email_logs` writes from `supabase/functions/send-email/index.ts`.

### Verify GTM
- Set `NEXT_PUBLIC_GTM_ID`, then ensure `GoogleTagManagerScript` renders and `window.dataLayer` receives events from `src/utils/analytics.ts`.
