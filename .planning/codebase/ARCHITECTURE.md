# Architecture

## System Pattern
- Primary pattern: **Next.js App Router with hybrid SSR + client interactivity**.
- High-level shape: **Backend-for-Frontend (BFF) style UI server** in `app/` + direct browser data access via Supabase client in `src/`.
- Runtime composition is mixed:
  - Server-side page shells and SEO metadata in `app/**/*.tsx`.
  - Client-heavy feature logic and UI composition in `src/views/*.tsx`.
  - Data services split by execution context:
    - Server: `src/lib/supabase/server.ts`
    - Browser: `src/integrations/supabase/client.ts`
  - Operational backend workflows in Supabase Edge Functions under `supabase/functions/*`.

## Layer Model

### 1) Entry and composition layer
- Root HTML shell and app metadata: `app/layout.tsx`.
- Global provider graph: `app/providers.tsx`.
- Session refresh request interceptor: `proxy.ts`.
- Route entrypoints (App Router):
  - Public listing/detail: `app/page.tsx`, `app/communities/page.tsx`, `app/discussions/page.tsx`, `app/events/page.tsx`, `app/c/[slug]/page.tsx`, `app/e/[shortCode]/page.tsx`.
  - Legacy-to-canonical redirects: `app/communities/[id]/page.tsx`, `app/events/[id]/page.tsx`.
  - Auth/protected: `app/auth/page.tsx`, `app/auth/callback/page.tsx`, `app/dashboard/page.tsx`, `app/profile/page.tsx`, `app/referrals/page.tsx`, `app/payment-success/page.tsx`.
  - API endpoint: `app/api/test-auth/route.ts`.

### 2) Page orchestration layer
- Most route files act as orchestration wrappers:
  - Fetch initial SSR data from `src/lib/supabase/server.ts`.
  - Render interactive client views from `src/views/*`.
  - Wrap in app chrome via `src/components/layout/AppLayoutWrapper.tsx`.
- Example flow:
  - `app/events/page.tsx` -> `getEvents/getPastEvents` (`src/lib/supabase/server.ts`) -> `src/views/Events.tsx`.

### 3) View/presentation layer
- Feature views in `src/views/*.tsx` hold most user-facing logic.
- Shared component layer:
  - Domain components: `src/components/*.tsx`
  - Layout components: `src/components/layout/*.tsx`
  - UI primitives: `src/components/ui/*.tsx`
- Styling system:
  - Global CSS in `app/globals.css`, `src/index.css`, `src/App.css`.
  - Tailwind setup in `tailwind.config.ts`.

### 4) State and behavior layer
- App/global state:
  - Auth state and auth actions: `src/contexts/AuthContext.tsx`
  - Theme state: `src/contexts/ThemeProvider.tsx`
- Async state and caching:
  - TanStack Query provider in `app/providers.tsx`
  - Query key registry in `src/utils/queryKeys.ts`
- Reusable behavior hooks:
  - Registration/payment orchestration: `src/hooks/useEventRegistration.ts`
  - Settings/feature flag read: `src/hooks/useAppSettings.ts`
  - Activity and analytics hooks: `src/hooks/useActivityLogger.ts`, `src/hooks/usePageTracking.ts`

### 5) Data access/integration layer
- Server data access (SSR-safe, cookie-based auth): `src/lib/supabase/server.ts`.
- Browser Supabase client (persistent auth): `src/integrations/supabase/client.ts`.
- Function invocation utility with timeout wrappers: `src/utils/supabaseWithTimeout.ts`.
- Router abstraction bridging legacy React Router semantics to Next App Router: `src/lib/nextRouterAdapter.tsx`.

### 6) External/backend workflows layer
- Supabase Edge Functions for side effects and privileged operations:
  - Payments: `supabase/functions/create-payment/index.ts`, `supabase/functions/verify-payment/index.ts`, `supabase/functions/payment-callback/index.ts`
  - Email system: `supabase/functions/send-email/index.ts`, `supabase/functions/welcome-email-trigger/index.ts`, `supabase/functions/get-email-template/index.ts`
  - Webhooks: `supabase/functions/webhook-dispatcher/index.ts`
- Schema and policy evolution via SQL migrations in `supabase/migrations/*.sql`.

## Data Flow

### A) SSR first render flow
1. Request enters `proxy.ts` (refreshes Supabase session cookies when available).
2. Route handler in `app/**/page.tsx` runs server-side.
3. Route calls server fetchers in `src/lib/supabase/server.ts`.
4. Server component passes initial data props into `src/views/*.tsx` client view.
5. Client hydrates and mounts inside providers from `app/providers.tsx`.

### B) Client query/refetch flow
1. Client views execute `useQuery` calls using `supabase` from `src/integrations/supabase/client.ts`.
2. Query keys are coordinated through `src/utils/queryKeys.ts`.
3. Mutations invalidate/refetch related caches (e.g., event registration flows).
4. UI reflects optimistic or live state updates.

### C) Auth/session flow
1. Browser auth state is managed in `src/contexts/AuthContext.tsx` with `supabase.auth.onAuthStateChange`.
2. Server identity checks use `getServerUser()` / `getServerSession()` in `src/lib/supabase/server.ts`.
3. `proxy.ts` keeps cookie-backed sessions fresh for SSR routes.
4. Route-level access enforcement for protected pages happens in `src/components/ProtectedRoute.tsx`.

### D) Paid event registration flow
1. User action starts in `src/components/EventRegistrationButton.tsx`.
2. Payment creation via Supabase Edge Function call (`create-payment`) from `src/components/PaymentButton.tsx`.
3. User completes gateway flow; webhook hits `supabase/functions/payment-callback/index.ts`.
4. Polling verification (`verify-payment`) confirms state in `src/components/PaymentButton.tsx`.
5. Registration row is created/upserted in backend function path, UI invalidates registration queries.

### E) Analytics flow
1. GTM scripts injected by `src/components/analytics/GoogleTagManager.tsx` from `app/layout.tsx`.
2. Automatic page view tracking via `src/components/analytics/AnalyticsProvider.tsx` + `src/hooks/usePageTracking.ts`.
3. Domain events emitted through `src/utils/analytics.ts` and activity logging hooks.

## Key Abstractions
- **Route adapter abstraction**: `src/lib/nextRouterAdapter.tsx`
  - Allows React Router-style navigation/location usage while running on Next App Router.
- **Server Supabase gateway**: `src/lib/supabase/server.ts`
  - Centralizes SSR-safe data fetch and typed response models.
- **Registration/payment orchestration abstraction**:
  - UI orchestration in `src/components/EventRegistrationButton.tsx` and `src/components/PaymentButton.tsx`.
  - Backend orchestration in payment edge functions under `supabase/functions/`.
- **Feature-flag abstraction**: `src/hooks/useAppSettings.ts`
  - Frontend reads payment enablement from `app_settings`.
- **Analytics abstraction**: `src/utils/analytics.ts`
  - Encapsulates GTM `dataLayer` contract.

## Entry Points
- Web app start: `app/layout.tsx` and `app/page.tsx`.
- HTTP request pre-processing: `proxy.ts`.
- API route entry: `app/api/test-auth/route.ts`.
- Build/runtime configuration: `next.config.mjs`, `package.json` scripts.
- Edge backend entrypoints: each `supabase/functions/*/index.ts`.

## Architectural Characteristics
- Strong SSR + SEO focus on public routes (`generateMetadata`, canonical redirects, dynamic sitemap in `app/sitemap.ts`).
- Progressive migration pattern visible:
  - Next App Router hosts route entries.
  - Legacy React Router semantics preserved through `src/lib/nextRouterAdapter.tsx` and client-heavy `src/views/`.
- Data boundary is pragmatic rather than strict:
  - Initial read models on server, ongoing interactions directly from browser client.
- Backend side effects and privileged operations are intentionally offloaded to Supabase Edge Functions.
