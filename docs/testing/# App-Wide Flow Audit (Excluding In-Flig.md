# App-Wide Flow Audit (Excluding In-Flight Payment Fix Files)

Date: 2026-02-16  
Scope: Auth, navigation/session, communities, discussions/comments, referrals, activity logging, email/webhook operations, analytics integrity.  
Explicitly excluded from actionable recommendations:  
- `supabase/functions/payment-callback/index.ts`  
- `supabase/functions/verify-payment/index.ts`  
- `supabase/functions/create-payment/index.ts`  
- `src/components/PaymentButton.tsx`  
- `src/hooks/useEventRegistration.ts`  
- New payment migration SQL (in progress by another agent)

---

## Executive Summary

The app is generally functional, but several cross-flow issues can create user/admin confusion and poor observability:

1. **Navigation/auth intent is not preserved** because the router adapter drops `location.state`, while multiple auth flows rely on it. This drives post-login misroutes and dead code paths.
2. **Tracking quality is degraded** by disabled activity loggers and duplicate analytics events, making funnel/debugging data unreliable.
3. **Optimistic UX currently reports success before server success** in several non-payment flows, producing false-positive toasts and trust erosion when writes fail.
4. **Referral onboarding has friction** (modal shown even without code, multi-path apply behavior), creating unnecessary drop-off for new OAuth users.
5. **Email/webhook integration has coupling gaps** (dispatcher trigger semantics mismatch), reducing confidence in admin-side delivery telemetry.

---

## Priority Matrix (ROI + Effort)

| ID | Finding | User/Admin Impact | Effort | ROI | Priority |
|---|---|---|---|---|---|
| A1 | Router adapter drops navigation state (`location.state` always null) | High misrouting + broken “return-to” experience | M | Very High | P0 |
| A2 | Protected route/auth redirect context not preserved | Login completion sends users to defaults vs intent | S | High | P0 |
| O1 | Activity logger exports disabled view loggers; event view overridden to no-op | Ops blind spots for engagement funnels | S | Very High | P0 |
| O2 | Duplicate comment analytics event emission | Double-counting, corrupted metrics | XS | Very High | P0 |
| U1 | Success toasts emitted in `onMutate` (before commit) across join/register/comment flows | False confirmations, support load | S-M | High | P1 |
| R1 | New OAuth users always get referral modal (even without code) | Onboarding friction | XS | High | P1 |
| E1 | Welcome-email trigger calls dispatcher with body, dispatcher ignores request body | Ambiguous webhook behavior for admins | M | Medium-High | P1 |
| C1 | Comment optimistic insert order mismatches query order (newest-first list) | Comment appears to “jump” / inconsistent UX | XS | Medium | P2 |
| A3 | Auth callback “clean URL” retains search params despite token-removal intent | Potential callback query persistence/confusion | S | Medium | P2 |
| M1 | Dead/unused registration handler in event detail client | Maintenance risk and divergence | XS | Medium | P3 |

Legend: XS < 0.5 day, S 0.5–1 day, M 1–3 days.

---

## Detailed Findings

### A1. Router adapter does not support navigation state, but app logic depends on it
**What I found**
- `useLocation()` in the Next adapter hardcodes `state: null`.
- `useNavigate()` accepts a `state` option but ignores it.
- Several flows read `location.state?.from?.pathname` expecting React Router behavior.

**Risk**
- Intended destination after auth is silently lost.
- Support sees “I logged in and got sent to dashboard/home instead of where I started.”

**Fix direction**
- Implement compatible state persistence in adapter (e.g., short-lived sessionStorage keyed by nonce in query).
- Or remove state-based expectations and switch all redirects to explicit query param (`next=/...`) contract.

**Effort / ROI**
- Effort: **M** (touches adapter + auth entry points)
- ROI: **Very High**

---

### A2. Protected-route redirect and auth “from” handling are inconsistent
**What I found**
- `ProtectedRoute` redirects to `/auth` without carrying origin context.
- Auth page still expects `location.state` fallback to `/dashboard`.

**Risk**
- Users lose workflow continuity.
- Private deep-link flows become “sign in then manually find page again.”

**Fix direction**
- Add `next` query parameter in redirects and honor it in auth callback.
- Remove stale React Router state assumptions.

**Effort / ROI**
- Effort: **S**
- ROI: **High**

---

### O1. Activity telemetry is partially disabled in code paths that still call it
**What I found**
- `useActivityLogger` has multiple loggers intentionally disabled (`Promise.resolve()` no-op).
- Returned `logEventView` is overridden as no-op despite earlier implementation.
- UI still invokes these methods, implying expected instrumentation that never lands.

**Risk**
- Funnel analytics and admin diagnostics are incomplete.
- Teams may make product decisions on missing/biased event coverage.

**Fix direction**
- Re-enable critical logger methods with a feature flag guard instead of hard no-op.
- Add coverage check test (unit-level) to assert logger methods call `logActivity` when enabled.

**Effort / ROI**
- Effort: **S**
- ROI: **Very High**

---

### O2. Comment create event is emitted twice
**What I found**
- `CommentForm` calls `analytics.createComment(...)` twice in `onMutate`.

**Risk**
- 2x inflation in comment-conversion metrics.
- Distorts experiment results and moderation workload projections.

**Fix direction**
- Remove duplicate call.
- Add a unit test around submit path to assert single event emission.

**Effort / ROI**
- Effort: **XS**
- ROI: **Very High**

---

### U1. Optimistic success messaging fires before server persistence
**What I found**
- Several mutations emit success toasts in `onMutate` before DB writes complete (community join/leave, event registration/comment patterns).

**Risk**
- User sees success then data reverts on error, reducing trust.
- Admins receive contradictory reports (“UI said joined, but I’m not in member list”).

**Fix direction**
- Move success toasts to `onSuccess`.
- Keep optimistic UI state but pair with neutral “Saving…” messaging during pending.
- Retain robust rollback in `onError`.

**Effort / ROI**
- Effort: **S-M** (depends on breadth)
- ROI: **High**

---

### R1. Referral modal appears for all new Google users, even when no referral code exists
**What I found**
- Dashboard logic intentionally opens referral modal for all new OAuth users regardless of code presence.

**Risk**
- Extra onboarding step for non-referred users.
- Increased abandonment right after first login.

**Fix direction**
- Gate modal by presence of pending code OR add explicit dismiss + “don’t show again” marker.
- Keep optional manual entry in a lower-friction surface (banner/profile section) instead of blocking modal.

**Effort / ROI**
- Effort: **XS**
- ROI: **High**

---

### E1. Welcome-email trigger and webhook dispatcher contract mismatch
**What I found**
- Welcome email trigger calls `webhook-dispatcher` with an event payload.
- Dispatcher ignores request body and only processes pre-existing rows in `webhook_deliveries` with status `pending`.

**Risk**
- Misleading integration assumption (appears to dispatch specific event but actually runs batch processor).
- Admin confusion when debugging missing real-time webhook events.

**Fix direction**
- Choose one model and codify it:
  1) enqueue delivery row then invoke dispatcher scheduler endpoint, or
  2) let dispatcher accept direct payload and process immediately.
- Add explicit response metadata (`mode: batch|direct`, `processed_ids`) for observability.

**Effort / ROI**
- Effort: **M**
- ROI: **Medium-High**

---

### C1. Comment optimistic insertion order conflicts with server sort
**What I found**
- Comments are fetched with `order(created_at, ascending: false)` (newest first).
- Optimistic comment is appended to the array, which places it at the bottom until refetch.

**Risk**
- Brief but noticeable UI inconsistency (“my comment appeared in wrong place”).

**Fix direction**
- Prepend optimistic comment for descending sort.

**Effort / ROI**
- Effort: **XS**
- ROI: **Medium**

---

### A3. Auth callback URL cleanup does not actually remove query params
**What I found**
- Callback says it cleans tokens, but it rewrites URL with `pathname + search`, keeping querystring.

**Risk**
- Callback parameters may remain in URL history.
- Confusing behavior during repeated callback retries.

**Fix direction**
- Replace URL with `pathname` only (or controlled allowlist of safe params).

**Effort / ROI**
- Effort: **S**
- ROI: **Medium**

---

### M1. Event detail has duplicated registration logic path
**What I found**
- `EventDetailClient` contains a `handleRegister` flow that is not used by the rendered CTA, which delegates to `EventRegistrationButton`.

**Risk**
- Future edits may patch one path and forget the other.
- Increased cognitive load and risk of stale behavior.

**Fix direction**
- Remove dead path or unify through single registration service function.

**Effort / ROI**
- Effort: **XS**
- ROI: **Medium**

---

## Recommended Implementation Order (Highest ROI first)

1. **P0 Week 1**: A1 + A2 + O2 + O1
2. **P1 Week 1–2**: U1 + R1
3. **P1 Week 2**: E1
4. **P2/P3 cleanup**: C1 + A3 + M1

---

## Admin Monitoring Additions (low effort, high leverage)

- Add a small “flow integrity” dashboard showing:
  - Auth starts vs successful post-auth redirected-to-intent ratio.
  - Comment creates vs unique comment IDs (to detect duplicate analytics).
  - Activity logger invocation vs persisted logs by action type.
  - Welcome-email sent vs webhook-delivered counts by correlation ID.
- Add weekly anomaly alerts on sudden metric doubling/halving.

---

## Notes on Payment Workstream Separation

Per instruction, payment-fix files already owned by another agent were not included in the implementation backlog above. However, cross-flow recommendations here are designed to reduce user confusion that often surfaces as “payment issues” in support channels (misrouting, stale toasts, weak observability), and should be implemented in parallel without conflicting with the payment patch set.
