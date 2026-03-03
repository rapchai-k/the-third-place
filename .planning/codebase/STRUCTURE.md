# Structure

## Top-Level Organization
- `app/`: Next.js App Router entrypoints, metadata, loading states, route handlers.
- `src/`: application implementation (views, components, contexts, hooks, utilities, integrations).
- `supabase/`: database migrations, local config, and Edge Functions.
- `public/`: static assets (icons, logo, manifest, robots, sitemap).
- `docs/`: product/technical docs (analytics, testing, setup guidance).
- `scripts/`: project utility scripts (e.g., sitemap and migration helpers).
- Root config/tooling files: `package.json`, `next.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `eslint.config.js`, `tsconfig.json`.

## Runtime Directory Map

### `app/` (route surface)
- Core shell:
  - `app/layout.tsx`
  - `app/providers.tsx`
  - `app/globals.css`
- Global status pages:
  - `app/loading.tsx`
  - `app/not-found.tsx`
- Public routes:
  - `app/page.tsx`
  - `app/communities/page.tsx`
  - `app/discussions/page.tsx`
  - `app/events/page.tsx`
- Detail and canonical routes:
  - `app/c/[slug]/page.tsx`
  - `app/e/[shortCode]/page.tsx`
  - `app/communities/[id]/page.tsx` (redirect bridge)
  - `app/events/[id]/page.tsx` (redirect bridge)
  - `app/discussions/[id]/page.tsx`
- Auth/app routes:
  - `app/auth/page.tsx`
  - `app/auth/callback/page.tsx`
  - `app/dashboard/page.tsx`
  - `app/profile/page.tsx`
  - `app/referrals/page.tsx`
  - `app/payment-success/page.tsx`
- Non-UI route handlers:
  - `app/api/test-auth/route.ts`
  - `app/sitemap.ts`

### `src/views/` (feature-level page logic)
- Route-facing feature views:
  - `src/views/Index.tsx`
  - `src/views/Communities.tsx`
  - `src/views/CommunityDetailClient.tsx`
  - `src/views/Events.tsx`
  - `src/views/EventDetailClient.tsx`
  - `src/views/Discussions.tsx`
  - `src/views/DiscussionDetailClient.tsx`
  - `src/views/Auth.tsx`
  - `src/views/AuthCallback.tsx`
  - `src/views/Dashboard.tsx`
  - `src/views/Profile.tsx`
  - `src/views/ReferralCenter.tsx`
  - `src/views/PaymentSuccess.tsx`

### `src/components/` (shared UI and feature components)
- Layout and route wrappers:
  - `src/components/layout/AppLayout.tsx`
  - `src/components/layout/AppLayoutWrapper.tsx`
  - `src/components/layout/PageSuspenseWrapper.tsx`
- Access/auth gate:
  - `src/components/ProtectedRoute.tsx`
- Domain features:
  - `src/components/EventRegistrationButton.tsx`
  - `src/components/PaymentButton.tsx`
  - `src/components/PaymentHistory.tsx`
  - `src/components/CommentForm.tsx`
  - `src/components/RequestTopicModal.tsx`
  - `src/components/FlagCommentDialog.tsx`
  - `src/components/GalleryDisplay.tsx`
  - `src/components/WhatsAppCollectionModal.tsx`
  - `src/components/referrals/*`
- Analytics:
  - `src/components/analytics/AnalyticsProvider.tsx`
  - `src/components/analytics/GoogleTagManager.tsx`
  - `src/components/analytics/index.ts`
- UI primitive library:
  - `src/components/ui/*.tsx`

### `src/contexts/` (global state providers)
- `src/contexts/AuthContext.tsx`
- `src/contexts/ThemeProvider.tsx`

### `src/hooks/` (behavioral units)
- Core hooks:
  - `src/hooks/useEventRegistration.ts`
  - `src/hooks/useActivityLogger.ts`
  - `src/hooks/useAppSettings.ts`
  - `src/hooks/usePageTracking.ts`
  - `src/hooks/useReferrals.ts`
  - `src/hooks/useWelcomeEmail.ts`
- Utility hooks:
  - `src/hooks/use-mobile.tsx`
  - `src/hooks/use-toast.ts`

### `src/lib/` and `src/utils/` (cross-cutting abstractions)
- Server-side data gateway:
  - `src/lib/supabase/server.ts`
- Router compatibility adapter:
  - `src/lib/nextRouterAdapter.tsx`
- Generic helpers:
  - `src/lib/utils.ts`
- Utility modules:
  - `src/utils/analytics.ts`
  - `src/utils/queryKeys.ts`
  - `src/utils/schema.ts`
  - `src/utils/supabaseWithTimeout.ts`
  - `src/utils/userUtils.ts`

### `src/integrations/` (external service SDK binding)
- Supabase browser client and types:
  - `src/integrations/supabase/client.ts`
  - `src/integrations/supabase/types.ts`

### `supabase/` (backend operational boundary)
- Local platform config: `supabase/config.toml`
- Migrations: `supabase/migrations/*.sql`
- Edge functions:
  - Payments: `supabase/functions/create-payment/index.ts`, `supabase/functions/verify-payment/index.ts`, `supabase/functions/payment-callback/index.ts`
  - Emails/templates: `supabase/functions/send-email/index.ts`, `supabase/functions/get-email-template/index.ts`, `supabase/functions/manage-email-template/index.ts`, `supabase/functions/test-email-template/index.ts`, `supabase/functions/email-template-analytics/index.ts`, `supabase/functions/welcome-email-trigger/index.ts`
  - Ops/integration: `supabase/functions/webhook-dispatcher/index.ts`, `supabase/functions/log-activity/index.ts`, `supabase/functions/email-log-check/index.ts`
  - Shared function utilities: `supabase/functions/shared/email-templates.ts`, `supabase/functions/shared/security-headers.ts`

## Dependency and Directional Structure
- Route files in `app/` depend on:
  - `src/lib/supabase/server.ts` for SSR data.
  - `src/views/*` for interactive UI.
  - `src/components/layout/*` for app chrome.
- Views in `src/views/` depend on:
  - `src/components/*` (composition)
  - `src/contexts/*` (auth/theme state)
  - `src/hooks/*` (feature behavior)
  - `src/integrations/supabase/client.ts` (browser data operations)
  - `src/lib/nextRouterAdapter.tsx` (navigation compatibility)
- Hooks/components mutate and query data via Supabase tables/functions.
- Edge functions in `supabase/functions/*` are independent backend units invoked via Supabase client function calls or external webhooks.

## Testing Structure
- Co-located unit/component tests:
  - `src/components/**/__tests__/*.test.tsx`
  - `src/hooks/**/__tests__/*.test.tsx`
  - `src/contexts/**/__tests__/*.test.tsx`
  - `src/lib/**/__tests__/*.test.ts`
  - `src/utils/**/__tests__/*.test.ts`
- Scenario and integration suites:
  - `src/test/integration/*.test.ts`
  - `src/test/rls/*.test.ts`
  - `src/test/database/*.test.ts`
  - `src/test/unit/*.test.ts`
- Test harness/bootstrap:
  - `src/test/setup.ts`
  - `src/test/utils/test-utils.tsx`
  - `src/test/run-tests.js`

## Notable Structural Traits
- Transitional structure from Vite/React Router to Next App Router remains visible:
  - `src/views/` and `src/lib/nextRouterAdapter.tsx` preserve prior page/component patterns.
  - `app/` provides modern route and SSR entrypoints.
- Clear operational split:
  - Product UI and orchestration in `app/` + `src/`.
  - Asynchronous/privileged backend operations in `supabase/functions/`.
- Large reusable UI primitive surface under `src/components/ui/`, with domain logic layered on top in `src/components/` and `src/views/`.
