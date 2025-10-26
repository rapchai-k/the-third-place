
# API Reference: My Third Place

This document reflects the current Supabase Edge Functions and planned endpoints. For Edge Functions, call via:
POST {SUPABASE_URL}/functions/v1/{function-name}
Include Authorization: Bearer {service role key for server-to-server} or user JWT if required.

Standard error envelope: see docs/02-error-envelope.md

---

## Implemented Edge Functions (Public API surface)

### Auth & Users
- Supabase Auth (Google OAuth) handles signup/login; profile routes are handled via Supabase client + RLS, not custom REST.

### Payments (Cashfree)
- POST /functions/v1/create-payment
  - Auth: User JWT required
  - Body: { eventId: string }
  - Returns: { success, payment_session_id, payment_url, order_id }
  - Notes: Creates payment_sessions, calls Cashfree Orders API; prevents duplicate registrations

- POST /functions/v1/payment-callback
  - Auth: None (Cashfree webhook)
  - Body: raw Cashfree webhook payload
  - Behavior: Verifies signature (placeholder today), logs in payment_logs, updates payment_sessions, may create event_registrations on success
  - Returns: 200 OK

- POST /functions/v1/verify-payment
  - Auth: User JWT required
  - Body: { paymentSessionId: string }
  - Returns: { success, payment_status, order_status, payment_session }

### Activity Logging
- POST /functions/v1/log-activity
  - Auth: Optional (user JWT if available; can log anonymous with metadata.anonymous)
  - Body: { action_type, target_type, target_id?, metadata? }
  - Returns: { success, activity_id }

### Email System
- POST /functions/v1/welcome-email-trigger
  - Auth: Service role
  - Body: { userId, userEmail, userName }
  - Behavior: Renders template, delegates to send-email, updates users.welcome_email_sent_at, enqueues webhook event (best-effort)
  - Returns: { success, messageId }

- POST /functions/v1/send-email
  - Auth: Service role
  - Body: { to, subject, html, from?, replyTo?, tags? }
  - Behavior: Sends via Resend, logs to email_logs
  - Returns: { success, messageId }

- POST /functions/v1/get-email-template
  - Auth: Service role
  - Query/Body: optional filters (templateId/templateName)
  - Behavior: Retrieves stored templates for preview/testing

- POST /functions/v1/test-email-template
  - Auth: Service role
  - Body: { templateId?, templateName?, eventType?, testEmail, sampleVariables, sendEmail? }
  - Behavior: Renders templates, optionally sends test message

### Webhook System
- POST /functions/v1/webhook-dispatcher
  - Auth: Service role
  - Behavior: Processes pending webhook_deliveries in batches, with HMAC signature and retries
  - Returns: { processed, failed, total }

---

## Planned or Admin-Panel Endpoints (Not implemented here)

### Admin Panel (separate app)
- Webhook configuration UI (create, edit, delete, subscribe events)
- Webhook delivery monitoring and testing tools
- Analytics dashboards for communities/events/users
- Moderation UI for flags and discussion content

### Future Backend Enhancements
- Payment refunds endpoint(s)
- Additional activity event wiring (automatic enqueue of more events)

---

## Legacy routes (from early draft, not implemented as REST in this repo)
- /auth/signup, /auth/login (handled by Supabase Auth)
- /user/* (profiles via Supabase client, not custom REST)
- /communities/* and /events/* fetches are via Supabase client queries
- /events/:id/register is now handled by create-payment + verify-payment flow
- /payments/callback is implemented as /functions/v1/payment-callback
- /discussions/* and /flags/* handled via Supabase tables + RLS and frontend logic

---

## Notes
- Authorization: User JWT for user actions; Service role for server-to-server and system functions
- RLS: All table access governed by Supabase RLS; Edge Functions use service role where needed
- Error handling: Follow docs/02-error-envelope.md for consistent error envelopes on frontend
- Webhooks: See docs/03-webhooks.md for event list and payload shape
- Testing: See docs/02-testing-plan for coverage expectations
