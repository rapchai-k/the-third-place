# Technology Stack

## Snapshot
- Primary runtime: **Node.js** for the web app (`package.json` scripts `dev/build/start` run Next).
- Frontend framework: **Next.js App Router** (`app/` routes + `next.config.mjs`).
- UI layer: **React 18 + TypeScript** (`app/providers.tsx`, `src/views/*.tsx`, `src/components/**/*.tsx`).
- Data/backend platform: **Supabase** (client SDK + server SSR client + edge functions in `supabase/functions/`).
- Styling: **Tailwind CSS + Radix UI + shadcn-style component setup** (`tailwind.config.ts`, `src/components/ui/*`, `components.json`).
- State/data fetching: **TanStack Query** (`app/providers.tsx`, hooks in `src/hooks/*`).
- Testing: **Vitest + Testing Library + Playwright dependency** (`vitest.config.ts`, `src/test/**`, `package.json`).
- Deployment target: **Vercel Next.js runtime** (`vercel.json`).

## Runtime And Framework

### Next.js 16 App Router Core
- App routes live in `app/` (examples: `app/page.tsx`, `app/events/page.tsx`, `app/e/[shortCode]/page.tsx`).
- Root layout with metadata and global providers is in `app/layout.tsx`.
- `next.config.mjs` enables:
  - `reactStrictMode`.
  - Turbopack alias `@ -> ./src`.
  - remote image patterns for Supabase storage and Google profile photos.
- `proxy.ts` is used (Next.js 16 middleware replacement) to refresh Supabase auth cookies for SSR.

### Hybrid Rendering Pattern
- Server components fetch public data using SSR helpers from `src/lib/supabase/server.ts`.
- Existing feature UIs remain in client view modules under `src/views/` and are mounted by `app/*/page.tsx` files.
- Canonical URL migration patterns are implemented in route handlers:
  - `app/events/[id]/page.tsx` redirects to `app/e/[shortCode]/page.tsx`.
  - Community detail has canonical slug route `app/c/[slug]/page.tsx`.

## Application Architecture

### UI Composition
- Shared layout shell: `src/components/layout/AppLayout.tsx` and `src/components/layout/AppLayoutWrapper.tsx`.
- Component library:
  - Base primitives in `src/components/ui/*` (Radix-backed shadcn style).
  - Feature components in `src/components/*` (payments, referrals, analytics, registration, moderation).
- Theme and UI providers:
  - `src/contexts/ThemeProvider.tsx`.
  - `app/providers.tsx` composes QueryClient, theme, auth, toasts, tooltips.

### State, Data Fetching, And Caching
- Server-side typed access layer: `src/lib/supabase/server.ts`.
  - Includes entity fetchers (`getEventById`, `getCommunityBySlug`, `getDiscussions`, `getHomePageData`, etc.).
- Client-side reads/writes:
  - Supabase browser SDK from `src/integrations/supabase/client.ts`.
  - Feature hooks in `src/hooks/*` (examples: `useEventRegistration.ts`, `useReferrals.ts`, `useAppSettings.ts`).
- Cache and invalidation model:
  - TanStack Query keys centralized in `src/utils/queryKeys.ts`.

## Data And Backend Stack

### Supabase Platform
- Database schema evolution through SQL migrations in `supabase/migrations/*.sql`.
- Generated DB typings consumed by app code: `src/integrations/supabase/types.ts`.
- Auth:
  - Client auth state in `src/contexts/AuthContext.tsx`.
  - SSR auth helpers in `src/lib/supabase/server.ts`.
  - Session refresh proxy in `proxy.ts`.
- Edge function fleet for domain workflows in `supabase/functions/*/index.ts`.

### Edge Runtime Stack
- Functions are Deno-based (`serve` from `https://deno.land/std/...`).
- Supabase client inside functions uses service role for privileged DB operations.
- Shared function utilities:
  - Security headers/CORS in `supabase/functions/shared/security-headers.ts`.
  - Email templating engine in `supabase/functions/shared/email-templates.ts`.

## Key Domain Subsystems

### Payments
- Frontend orchestration: `src/components/PaymentButton.tsx`, `src/components/EventRegistrationButton.tsx`.
- API timeout wrapper for function invokes: `src/utils/supabaseWithTimeout.ts`.
- Backend execution in edge functions:
  - `supabase/functions/create-payment/index.ts`
  - `supabase/functions/verify-payment/index.ts`
  - `supabase/functions/payment-callback/index.ts`

### Email + Template Operations
- Template rendering and orchestration: `supabase/functions/welcome-email-trigger/index.ts`.
- Provider handoff: `supabase/functions/send-email/index.ts`.
- Template CRUD/test/analytics endpoints:
  - `supabase/functions/manage-email-template/index.ts`
  - `supabase/functions/get-email-template/index.ts`
  - `supabase/functions/test-email-template/index.ts`
  - `supabase/functions/email-template-analytics/index.ts`

### Analytics
- GTM bootstrapping in `src/components/analytics/GoogleTagManager.tsx`.
- Page-level tracking provider in `src/components/analytics/AnalyticsProvider.tsx`.
- Event utility abstraction in `src/utils/analytics.ts`.
- Hook integration in `src/hooks/usePageTracking.ts` and feature-level calls (e.g. `src/components/PaymentButton.tsx`).

## Tooling And Quality

### TypeScript And Linting
- TS configuration is intentionally relaxed (`strict: false`, `strictNullChecks: false`) in `tsconfig.json` and `tsconfig.app.json`.
- ESLint setup in `eslint.config.js` uses `typescript-eslint`, hooks rules, and react-refresh checks.

### Testing
- Test runner: Vitest (`vitest.config.ts`).
- Test setup and utilities:
  - `src/test/setup.ts`
  - `src/test/utils/*`
- Test coverage spans:
  - Unit tests (`src/lib/__tests__`, `src/hooks/__tests__`, `src/components/**/__tests__`).
  - Integration tests (`src/test/integration/*.test.ts`).
  - RLS/security tests (`src/test/rls/*.test.ts`).
  - DB constraint tests (`src/test/database/constraints.test.ts`).
- E2E tooling is present via scripts/deps (`package.json` + `@playwright/test`) but config/spec footprint is minimal in current tree.

## Build, Assets, And Delivery
- Build/development commands are standardized in `package.json` (`next dev`, `next build`, `next start`).
- Tailwind/PostCSS pipeline:
  - `tailwind.config.ts`
  - `postcss.config.js`
- Static/public assets in `public/` (icons, manifest, sitemap, robots).
- Dynamic sitemap generation uses `app/sitemap.ts` and supplemental script `scripts/generate-sitemap.mjs`.
- Vercel deployment descriptor: `vercel.json`.

## Notable Stack Characteristics
- This codebase shows an active migration history: legacy Vite-era artifacts (`vite.config.ts`, `src/views/*`) coexist with a production Next App Router structure (`app/*`, `next.config.mjs`).
- Supabase is both database/auth backbone and application backend compute layer (edge functions), so most domain logic is split between React client code and Supabase functions rather than a separate Node API server.
- Payments, email, and webhooks are implemented as first-class backend capabilities, not lightweight stubs, and are tied directly to schema/migration changes under `supabase/migrations/`.
