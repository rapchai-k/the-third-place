# CONCERNS

## Scope
- This document maps technical debt, known issues, security/performance risks, and fragile implementation areas observed in the current repository state.
- Focus areas reviewed: Next.js app/router integration, Supabase edge functions, payment flows, auth/session handling, migrations, testing coverage, and frontend runtime behavior.

## Critical Security Risks

1. Unauthenticated privileged email/admin edge functions
- Files: `supabase/functions/manage-email-template/index.ts`, `supabase/functions/get-email-template/index.ts`, `supabase/functions/email-template-analytics/index.ts`, `supabase/functions/test-email-template/index.ts`, `supabase/functions/send-email/index.ts`
- Problem: These handlers initialize clients with `SUPABASE_SERVICE_ROLE_KEY` but do not authenticate or authorize the caller before executing privileged reads/writes and email sends.
- Impact: External callers can potentially read template data, mutate templates, query email logs, trigger test sends, and send arbitrary email through the project account.
- Fragility: Abuse can create data corruption, outbound email reputation damage, and billing spikes.

2. Wildcard CORS on privileged function surface
- File: `supabase/functions/shared/security-headers.ts`
- Problem: `Access-Control-Allow-Origin: *` is applied globally to edge functions, including privileged routes.
- Impact: Browser-origin restrictions provide no defense-in-depth for sensitive function endpoints.
- Note: CORS is not auth; combined with missing auth checks above, this increases exploitability.

3. Public debug auth route in app API
- File: `app/api/test-auth/route.ts`
- Problem: Diagnostic endpoint returns authentication/session metadata and is not environment-gated.
- Impact: Information disclosure (session presence, token existence, auth timing) and expanded probing surface in production.

## High-Risk Functional/Operational Issues

4. Payment state race and cancellation consistency risk
- Files: `supabase/functions/payment-callback/index.ts`, `supabase/functions/verify-payment/index.ts`, `src/hooks/useEventRegistration.ts`, `src/components/PaymentButton.tsx`
- Problem: Multiple writers update payment/registration state (webhook callback + polling verify + client cancellation flow) without transactional coordination.
- Impact: Users can hit edge cases (paid but cancelled, duplicate transitions, delayed registration visibility), especially under webhook latency/retry conditions.
- Fragility signals: business logic duplication across callback and verify paths; client-side cancellation mutates paid sessions before backend reconciliation.

5. Webhook dispatcher can be externally triggered and fan out network calls
- File: `supabase/functions/webhook-dispatcher/index.ts`
- Problem: No caller auth guard; function sends HTTP POST to configured URLs for pending deliveries.
- Impact: Attackers can repeatedly trigger outbound delivery attempts, amplifying traffic and creating operational noise/cost.

6. Timeout utility gives false confidence and leaks in-flight requests
- File: `src/utils/supabaseWithTimeout.ts`
- Problem: `invokeWithTimeout` creates an `AbortController` but does not pass a signal to `functions.invoke`; `invokeWithTimeoutRace` times out logically but does not cancel in-flight requests.
- Impact: Under degraded network/function latency, requests continue executing server-side while UI believes they timed out.
- Risk: duplicated retries, extra load, inconsistent UX states.

## Architecture/Technical Debt

7. Hybrid framework debt (Next.js runtime with leftover Vite-era compatibility)
- Files: `package.json`, `vite.config.ts`, `vitest.config.ts`, `src/lib/nextRouterAdapter.tsx`, `app/providers.tsx`, `src/integrations/supabase/client.ts`
- Problem: Mixed conventions and compatibility shims (e.g., React Router adapter, `vite-ui-theme` storage key, dual env variable strategies) indicate incomplete migration.
- Impact: Higher onboarding/debug overhead, more edge-case behavior differences between server/client execution contexts.

8. Observability is intentionally stripped in critical backend paths
- Files: `supabase/functions/create-payment/index.ts`, `supabase/functions/verify-payment/index.ts`, `supabase/functions/payment-callback/index.ts`, `supabase/functions/log-activity/index.ts`, `supabase/functions/send-email/index.ts`
- Problem: Many `logStep` helpers are effectively no-ops.
- Impact: Incident triage and production debugging are significantly harder, especially for payments and async workflows.

9. Activity logging is partially disabled in frontend hook
- File: `src/hooks/useActivityLogger.ts`
- Problem: several logging methods return early (`Promise.resolve()`) with code commented out.
- Impact: analytics/audit datasets become incomplete and misleading; downstream reports undercount core interactions.

10. Security header strategy is inconsistent across functions
- Files: `supabase/functions/shared/security-headers.ts`, `supabase/functions/create-payment/index.ts`, `supabase/functions/log-activity/index.ts`, `supabase/functions/send-email/index.ts`
- Problem: `getSecureHeaders` is imported widely but many responses still return only `corsHeaders`.
- Impact: uneven hardening posture and unpredictable response-header behavior across endpoints.

## Data Layer Fragility

11. Migration history shows legacy/table-policy drift risk
- Files: `supabase/migrations/20260211000001_enable_rls_on_all_tables.sql`, `supabase/migrations/20250806091345_03ed66d6-2765-48d7-8d7a-ceb2b9a683ff.sql`, `src/integrations/supabase/types.ts`
- Problem: RLS migration references legacy tables such as `public.comments` while app types center on `discussion_comments`; migration set appears to carry historical schemas in parallel.
- Impact: policy review complexity, brittle assumptions during future migrations, and greater chance of partial hardening.

12. Status lifecycle complexity is spread across migrations and app code
- Files: `supabase/migrations/20250910000001_simplify_status_enums.sql`, `supabase/migrations/20260129100001_extend_payment_status_enum.sql`, `supabase/functions/payment-callback/index.ts`, `supabase/functions/verify-payment/index.ts`
- Problem: enum evolution happened in stages; app logic depends on multiple status vocabularies across different layers.
- Impact: regression risk when introducing refunds/retries/backfills, and increased likelihood of unhandled state transitions.

## Performance and UX Fragility

13. Potential IntersectionObserver leak/churn on home page
- File: `src/views/Index.tsx`
- Problem: observer is created inside a callback without explicit disconnect lifecycle management.
- Impact: repeated observer attachment over time can increase callback churn and degrade performance on long sessions.

14. Heavy initial homepage payload patterns
- File: `src/views/Index.tsx`
- Problem: multiple DB reads plus gallery fetching and client-side transformations on first load; some fallback assets are remote URLs.
- Impact: slower first interactive experience and higher variability under weaker networks.

## Testing and Verification Gaps

15. Critical edge functions have little/no direct automated test coverage
- Files: `supabase/functions/*`, `src/test/integration/*.test.ts`, `package.json`
- Problem: existing tests focus on frontend/integration/RLS scenarios; no dedicated edge-function unit/integration suite for payment/email/webhook handlers.
- Impact: regressions in privileged backend workflows can ship undetected.

16. Important database tests are not part of default CI script path
- Files: `src/test/rls/*.test.ts`, `package.json`
- Problem: RLS tests exist but are not explicitly included in primary script chains like `test:all`.
- Impact: policy regressions may be missed unless run manually.

## Priority Order (Recommended)
1. Lock down privileged edge functions with strict authz checks and role validation (`manage/get/test/analytics/send-email`, `webhook-dispatcher`).
2. Restrict CORS for privileged endpoints and remove/guard debug API route in production.
3. Consolidate payment state transitions into a single authoritative backend workflow with idempotent, transactional updates.
4. Fix timeout abstraction to use real cancellation semantics (or remove misleading API).
5. Add focused automated tests for payment/email/webhook edge functions and include DB policy tests in CI path.
6. Reduce migration/framework drift by documenting target architecture and deleting obsolete compatibility paths.
