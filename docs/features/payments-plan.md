# Payments Feature Flag Plan

## 1. Objective

Deploy the new codebase and database changes while **fully disabling all new payment flows** (Razorpay) until we are ready to switch them on.

Free events must continue to work as today.

---

## 2. High‑level design

Use a **single feature flag**, wired into both frontend and Supabase Edge Functions:

- Frontend (Next.js): `NEXT_PUBLIC_ENABLE_PAYMENTS`
- Edge Functions (Supabase): `ENABLE_PAYMENTS`

Semantics:

- When `false` → **no new paid registrations can be initiated**.
- When `true` → current payment behavior is enabled.

Existing / in‑flight payments can still be verified and recorded (recommended), even when the flag is `false`.

---

## 3. Configuration

### 3.1 Frontend env

Add to `.env` / `.env.local`:

- `NEXT_PUBLIC_ENABLE_PAYMENTS=false`

Frontend code will read:

- `const paymentsEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true';`

### 3.2 Supabase Edge Functions env

In Supabase function secrets (per environment):

- `ENABLE_PAYMENTS=false`

Edge functions will read:

- `const enablePayments = Deno.env.get("ENABLE_PAYMENTS") === "true";`

---

## 4. Frontend behavior

Key components:

- `src/components/EventRegistrationButton.tsx`
- `src/components/PaymentButton.tsx`
- `src/views/PaymentSuccess.tsx`

### 4.1 EventRegistrationButton

Current behavior:

- For paid events (`price > 0`): shows `<PaymentButton />` to start payment flow.
- For free events: writes directly into `event_registrations`.

Planned gating (recommended default):

- If `!paymentsEnabled` and `price > 0`, we could treat the event as **temporary free RSVP** by routing through the existing “free event” registration path instead. This would register users without taking payment.

### 4.2 PaymentButton

Current behavior:

- Calls `create-payment` Edge function.
- Opens Razorpay payment link in new tab.
- Polls `verify-payment` until paid/timeout.

Planned gating:

- Read `paymentsEnabled` at module level.
- If `!paymentsEnabled`:
  - `handlePayment` must **not call** `createPaymentMutation.mutate()`.
  - Show a toast: e.g. “Payments are temporarily disabled. Please check back soon.”
  - Optionally render the button disabled with corresponding label.

### 4.3 PaymentSuccess page

Current behavior:

- Uses `session_id` query param.
- Calls `verify-payment` to display status.

Plan:

- Keep behavior **unchanged** even when payments are disabled, so that users with in‑flight or historical payment links can still see their status.
- Show a small banner when `!paymentsEnabled`, e.g. “New payments are currently disabled; this page reflects an existing payment only.”

---

## 5. Edge Functions behavior

Key functions:

- `supabase/functions/create-payment/`
- `supabase/functions/verify-payment/`
- `supabase/functions/payment-callback/` (webhook)

### 5.1 create-payment (hard gate)

- After handling CORS/OPTIONS and before any business logic:
  - Read `ENABLE_PAYMENTS`.
  - If `false`, immediately return a `4xx/5xx` JSON response, e.g. `{ "error": "Payments are currently disabled" }`.
- This prevents:
  - Creating new `payment_sessions`.
  - Calling Razorpay to create payment links.

### 5.2 verify-payment (soft gate)

Recommended:

- **Do not block** this function when payments are disabled.
- Rationale:
  - It does not initiate payments; it only verifies status and upserts registrations.
  - Allows already‑created payment links to settle correctly.

Strict alternative (not recommended unless required):

- Short‑circuit when `!ENABLE_PAYMENTS`, skip Razorpay API calls, and return current DB status only. This can leave statuses stale.

### 5.3 payment-callback (webhook)

Recommended:

- Keep webhook fully active regardless of flag.
- Rationale:
  - Does not create payments; only reflects Razorpay events into `payment_sessions` and `event_registrations`.
  - Ensures any late payments from older links are recorded correctly.

Strict alternative:

- If `!ENABLE_PAYMENTS`, immediately return `200 OK` without touching the DB. This will ignore late payment events.

---

## 6. Rollout playbook

1. **Before deploy**
   - Set `NEXT_PUBLIC_ENABLE_PAYMENTS=false` in the app setting table
   - Set `ENABLE_PAYMENTS=false` in Supabase Edge Function secrets.
2. **Deploy**
   - Deploy frontend, Edge Functions, and DB migrations as usual.
3. **Post‑deploy (flag = false)**
   - Free events: unaffected.
   - Paid events: no Pay button, no new `create-payment` calls.
   - Existing/in‑flight payments: still processed via `verify-payment` + `payment-callback`.
4. **Enable payments later**
   - Flip to `true` in both envs.
   - Redeploy frontend / Edge Functions as required.
   - Paid events now show Pay buttons and follow the full Razorpay flow.

