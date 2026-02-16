# Payment Hardening — Agent Handoff Document

**Date:** 2026-02-16  
**Project:** the-third-place (mythirdplace.rapchai.com)  
**Repository:** https://github.com/rapchai-k/the-third-place  
**Linear Project:** [the-third-place](https://linear.app/karans/project/the-third-place-d5a16ae88122) (ID: `78d29d88-c954-4f43-b575-013e3e278010`)  
**Team ID:** `e25ce68a-001d-4f9f-853d-ac937139b993`

---

## Current Status

### ✅ Completed: KAR-66 — State Machine Transition Guard

**Branch:** `kar-66/payment-state-machine-guard` (pushed to origin)  
**Commit:** [`5cb0e9c`](https://github.com/rapchai-k/the-third-place/commit/5cb0e9c)  
**Linear Status:** In Review  
**Priority:** 🔴 Urgent

**What was done:**
- Added monotonic state machine guard in both `payment-callback/index.ts` and `verify-payment/index.ts`
- Terminal states (`paid`, `refunded`) can no longer be downgraded by out-of-order webhooks or stale API reads
- If session is already `paid`, only `refunded` transition is allowed
- `payment-callback` returns `200 OK` to Razorpay when guard fires (prevents retries)
- `verify-payment` returns current correct state to frontend when guard fires
- Fixed 4 pre-existing `@typescript-eslint/no-explicit-any` violations that were blocking pre-commit hooks

**Files modified:**
- `supabase/functions/payment-callback/index.ts` (lines 7, 86, 122, 154-171)
- `supabase/functions/verify-payment/index.ts` (lines 5, 131-165)

**Next action for KAR-66:** Create PR and merge after review

---

## Remaining Work — Two-Track Execution Plan

All branches have been created. Current branch: `kar-66/payment-state-machine-guard`

### Track A — Backend (Edge Functions + Migration)

| Order | Ticket | Branch | Status | Priority | What to do |
|-------|--------|--------|--------|----------|------------|
| ✅ 1 | **KAR-66** | `kar-66/payment-state-machine-guard` | In Review | 🔴 Urgent | Create PR, merge after review |
| 2 | **KAR-69** | `kar-69/cleanup-orphaned-sessions` | Todo | 🟠 High | Cleanup orphaned sessions on Razorpay API failure |
| 3 | **KAR-70** | `kar-70/idempotent-session-creation` | Todo | 🟠 High | Idempotent session creation (reuse active payment link) |
| 4 | **KAR-68** (backend) | `kar-68/cancellation-conflict-guard` | Todo | 🔴 Urgent | Migration + edge function guard for user cancellation |

### Track B — Frontend (React Components + Hook)

| Order | Ticket | Branch | Status | Priority | What to do |
|-------|--------|--------|--------|----------|------------|
| 1 | **KAR-67** | `kar-67/terminal-state-polling-ux` | Todo | 🟠 High | Stop polling on terminal failure states in PaymentButton |
| 2 | **KAR-71** | `kar-71/popup-blocker-mitigation` | Todo | 🟡 Medium | Pre-open blank tab to avoid popup blockers |
| 3 | **KAR-68** (frontend) | `kar-68/cancellation-conflict-guard` | Todo | 🔴 Urgent | Update useEventRegistration cancel mutation |

---

## Next Steps (Recommended Order)

### Step 1: Switch to main and start Track A

```bash
git checkout main
git pull origin main
git checkout kar-69/cleanup-orphaned-sessions
```

### Step 2: KAR-69 — Cleanup Orphaned Sessions

**File to edit:** `supabase/functions/create-payment/index.ts`

**What to implement:**
- When Razorpay API call fails (after creating payment_session record), mark the session as `failed`
- Currently: session stays in `pending` state with no payment link → orphaned
- Fix: Add error handling after Razorpay API call to update session status to `failed`

**Reference from review doc (Finding #4):**
> If the Razorpay API call fails after we've inserted the payment_session, the session remains in pending with no razorpay_payment_link_id. The user sees "Payment initialization failed" but the DB has an orphaned session.

**Implementation hint:**
Look for the Razorpay API call in `create-payment/index.ts` (around line 80-120), add try-catch or error check, and update the session to `failed` if API call fails.

**Commit message template:**
```
feat(payment): cleanup orphaned sessions on Razorpay API failure

Implements KAR-69: Mark payment_session as 'failed' when Razorpay
payment link creation fails, preventing orphaned pending sessions.

- Wrap Razorpay API call in error handling
- Update session status to 'failed' if API returns error
- User can retry payment without DB pollution
```

**After completion:**
- Commit, push to `kar-69/cleanup-orphaned-sessions`
- Update Linear KAR-69 with commit link
- Move to "In Review" state (UUID: `df3381bb-a85a-4bc1-a55a-28989e8eeb15`)

---

### Step 3: KAR-70 — Idempotent Session Creation

**File to edit:** `supabase/functions/create-payment/index.ts`

**What to implement:**
- Before creating new payment_session, check if user already has an active session for this event
- Active = `status IN ('pending', 'completed')` AND `payment_status = 'yet_to_pay'` AND `razorpay_payment_link_id IS NOT NULL`
- If found, return existing session instead of creating duplicate
- Prevents duplicate charges when user clicks "Pay" multiple times

**Reference from review doc (Finding #5):**
> No server-side idempotency check. If the user clicks "Pay" twice quickly, two payment_sessions and two Razorpay payment links are created.

**Implementation hint:**
Add query at the start of the edge function (after auth check) to find existing active session. If found, return it. Otherwise, proceed with creation.

**Commit message template:**
```
feat(payment): idempotent session creation to prevent duplicates

Implements KAR-70: Reuse existing active payment session instead of
creating duplicates when user clicks Pay multiple times.

- Check for existing active session before creation
- Return existing session if found (pending + yet_to_pay + has link)
- Prevents duplicate Razorpay payment links and potential double charges
```

---

### Step 4: KAR-68 (Backend) — Cancellation Conflict Guard

**Files to edit:**
1. New migration: `supabase/migrations/YYYYMMDDHHMMSS_add_cancelled_by_user_at.sql`
2. `supabase/functions/payment-callback/index.ts`
3. `supabase/functions/verify-payment/index.ts`

**What to implement:**

**Migration:**
```sql
ALTER TABLE payment_sessions 
ADD COLUMN cancelled_by_user_at TIMESTAMPTZ;

CREATE INDEX idx_payment_sessions_cancelled_by_user 
ON payment_sessions(cancelled_by_user_at) 
WHERE cancelled_by_user_at IS NOT NULL;
```

**Edge functions:**
- In both `payment-callback` and `verify-payment`, after fetching payment_session, check if `cancelled_by_user_at IS NOT NULL`
- If user-cancelled, skip registration creation even if webhook says `paid`
- Log the conflict for audit

**Reference from review doc (Finding #2):**
> User clicks Cancel → registration deleted → late paid webhook arrives → registration re-created → user is registered despite cancelling.

---

### Step 5: Switch to Track B (Frontend)

```bash
git checkout main
git pull origin main
git checkout kar-67/terminal-state-polling-ux
```

### Step 6: KAR-67 — Terminal State Polling UX

**File to edit:** `src/components/PaymentButton.tsx` (or similar)

**What to implement:**
- In `verifyPayment` polling loop, check for terminal failure states: `failed`, `expired`, `cancelled`
- Stop polling immediately when these states are detected
- Show specific error message to user instead of generic timeout

---

### Step 7: KAR-71 — Popup Blocker Mitigation

**File to edit:** `src/components/PaymentButton.tsx`

**What to implement:**
- Pre-open blank tab synchronously on button click: `const tab = window.open('about:blank')`
- After async payment link creation, assign URL: `tab.location.href = paymentUrl`
- Add fallback if `tab` is null (blocked): show modal with direct link

---

### Step 8: KAR-68 (Frontend) — Cancellation Conflict Guard

**File to edit:** `src/hooks/useEventRegistration.ts` (or similar)

**What to implement:**
- In cancel mutation, update `payment_sessions.cancelled_by_user_at = NOW()` for paid sessions
- This works with backend guard from Step 4 to prevent re-registration

---

## Important Notes

1. **Pre-commit hooks:** ESLint runs with `--max-warnings 0`. Fix any `@typescript-eslint/no-explicit-any` violations before committing.

2. **Linear workflow states:**
   - Todo: `4e87eedf-dc95-4b38-8075-a6db5375abf0`
   - In Progress: `f3532472-be90-4593-8f0a-725fe5e0afd8`
   - In Review: `df3381bb-a85a-4bc1-a55a-28989e8eeb15`
   - Done: `c76e5f86-c4a1-41ab-8ddb-a497f1e4d757`

3. **All tickets are tagged:** `current-sprint`

4. **Source document:** `docs/testing/# Payment Flow Review (Razorpay) — 2026-.md` (contains all 6 findings with detailed explanations)

5. **Supabase project:** `ggochdssgkfnvcrrmtlp` (region: ap-southeast-1)

---

## Questions to Ask User

- Should I create PRs for each branch individually, or one mega-PR at the end?
- Do you want me to deploy edge functions after each merge, or wait until all are done?
- Should I write tests for these changes?

