# Payment Flow Review (Razorpay) — 2026-02-16

## Scope reviewed

- Frontend payment initiation, polling, and payment success UX.
- Supabase Edge Functions: `create-payment`, `verify-payment`, and `payment-callback`.
- Event registration cancellation interactions with paid sessions.
- RLS/policy/migration behavior relevant to payment state transitions.

---

## Key findings

### 1) **High** — Webhook/verification can regress terminal successful payments to failed/cancelled/expired

**Where**
- `payment-callback` always applies the incoming event state directly (including `failed`, `cancelled`, `expired`) and updates the row without guarding against already-`paid` sessions.
- `verify-payment` also maps Razorpay link state directly and updates row if state differs.

**Why this is risky**
Out-of-order or delayed events are common in payment systems. If a `payment_link.paid` arrives first and later `payment.failed` or `payment_link.expired` arrives (or stale API status read), the system can overwrite `paid` with a non-success state. That causes:
- Incorrect admin reporting/state history.
- Confusing user status regressions.
- Potential downstream logic conflicts (e.g., cancellation/refund workflows).

**Recommendation**
Implement a monotonic state machine for `payment_status`:
- `paid` should be terminal (except explicit `refunded`).
- Reject downgrades (`paid -> failed/expired/cancelled`).
- Record raw webhook event in logs, but gate state transition rules before update.

---

### 2) **High** — User cancellation can be undone by late `paid` webhook/verify path

**Where**
- Frontend cancellation marks `payment_sessions` from `paid` to `cancelled`.
- Both `payment-callback` and `verify-payment` create/upsert `event_registrations` whenever computed status is `paid`.

**Why this is risky**
A user/admin can cancel registration, but a delayed payment success signal can recreate the registration (`upsert` on `user_id,event_id`). This produces poor user trust and support burden (“I cancelled but got re-registered”).

**Recommendation**
- Add explicit guard in webhook/verify upsert logic: only (re)create registration when session is not user-cancelled after payment.
- Consider a dedicated immutable `cancelled_at`/`cancel_reason` field and transition rules.
- If `cancelled` is intended to represent refund-required state, prevent automatic re-registration unless there is a deliberate reactivation flow.

---

### 3) **Medium** — Payment button polling ignores terminal failure states, causing timeout-based UX

**Where**
- `PaymentButton.verifyPayment` only treats `paid` as actionable success.
- For `failed` / `expired` / `cancelled`, polling keeps running until max attempts or timeout.

**User impact**
Users who already have a terminal failed state wait up to 5 minutes and see timeout messaging, instead of immediate clear next steps.

**Recommendation**
Handle terminal states immediately in polling:
- Stop polling.
- Show specific reason (`failed`, `expired`, `cancelled`).
- Offer retry action (new payment session) directly.

---

### 4) **Medium** — Orphaned payment sessions created before payment link creation can leave confusing trails

**Where**
- `create-payment` inserts `payment_sessions` first, then calls Razorpay API.
- If API call fails, no rollback/cleanup is done.

**Impact**
- Admin sees `yet_to_pay` sessions without `razorpay_payment_link_id`.
- These sessions can pollute pending-payment queries/history and make support analysis harder.

**Recommendation**
- Use a two-phase flow with failure cleanup (delete/mark failed when link creation fails).
- Persist explicit error metadata for observability.

---

### 5) **Medium** — Potential duplicate charge attempts due to no server-side idempotency on session creation

**Where**
- `create-payment` creates a new session every invocation without checking existing open session for same user/event.

**Impact**
Users can generate multiple live payment links (e.g., multiple tabs or retries), increasing accidental double-pay risk and reconciliation complexity.

**Recommendation**
- Enforce one active unpaid session per `user_id,event_id` (partial unique index + reuse policy).
- Return existing valid payment link when appropriate.

---

### 6) **Low** — Popup blocker risk after async operation

**Where**
- `window.open` is executed after async mutation success callback.

**Impact**
On some browsers/settings, this can be blocked because it is no longer in strict direct user gesture context, leading to “nothing happened” experience.

**Recommendation**
- Pre-open a blank tab synchronously on click, then assign URL when backend returns.
- Or perform full-page redirect fallback when popup blocked.

---

## Additional notes for tracking/analytics/admin operations

- Cancellation path marks `paid` sessions as `cancelled` for tracking, but there is no explicit refund workflow linkage in this reviewed flow; finance/revenue dashboards may drift if `cancelled` is interpreted as refunded.
- Both webhook and verify fallback can write registrations; this is good for resiliency, but should be coupled with strict transition guards and deduping semantics.

---

## Suggested hardening backlog (ordered)

1. **State machine + transition guard** in both `payment-callback` and `verify-payment`.
2. **Cancellation conflict policy** (prevent auto re-register after explicit cancellation).
3. **Immediate terminal-state UX** in `PaymentButton` polling.
4. **Idempotent session creation** (reuse active link).
5. **Error-state persistence/cleanup** for failed link creation.
6. Optional: stronger observability fields (`last_gateway_event`, `gateway_event_at`, `transition_source`).

