# Coding Conventions Map

## Stack and Architecture
- App routing uses Next.js App Router under `app/` (for example `app/page.tsx`, `app/layout.tsx`, `app/communities/[id]/page.tsx`).
- Feature UI and client-heavy logic live in `src/views/` (for example `src/views/Index.tsx`, `src/views/CommunityDetailClient.tsx`).
- Shared UI primitives are in `src/components/ui/` using Radix + class-variance-authority patterns (for example `src/components/ui/button.tsx`).
- Supabase integration is split between browser client in `src/integrations/supabase/client.ts` and server helpers in `src/lib/supabase/server.ts`.

## TypeScript and Imports
- Project uses TypeScript with relaxed strictness (`"strict": false`, `"strictNullChecks": false`) in `tsconfig.json`.
- Path alias `@/*` is the standard import style (`tsconfig.json`, `vitest.config.ts`).
- Types are colocated with usage and frequently imported via `type` imports (for example `app/page.tsx`, `src/lib/supabase/server.ts`).
- Some tests opt out of type checking with `// @ts-nocheck` (for example `src/test/integration/auth.integration.test.ts`, `src/test/rls/user-data-isolation.test.ts`).

## React Patterns
- Server components fetch data and pass hydrated props into client components (`app/page.tsx` -> `src/views/Index.tsx`).
- Client components are explicitly marked with `'use client'` and usually combine React Query + Supabase (`src/views/Index.tsx`, `src/views/CommunityDetailClient.tsx`).
- Context-driven state is used for auth/theme concerns (`src/contexts/AuthContext.tsx`, `src/contexts/ThemeProvider.tsx`).
- Reusable provider composition is centralized in `app/providers.tsx` and consumed in `app/layout.tsx`.

## Styling and UI Conventions
- Tailwind utility classes are the default styling mechanism across app and components (`app/globals.css`, `src/views/Index.tsx`).
- Class composition helper `cn()` (`clsx` + `tailwind-merge`) is the shared pattern (`src/lib/utils.ts`).
- Variant-driven component APIs use `cva` from class-variance-authority (`src/components/ui/button.tsx`).
- Design language is strongly custom (neo-brutalist tokens and shadows), not default shadcn styling (`src/components/ui/button.tsx`, `src/views/Index.tsx`).

## Data and Domain Conventions
- Supabase query style is fluent and table-centric (`.from(...).select(...).eq(...)`) in both client and SSR helpers (`src/views/CommunityDetailClient.tsx`, `src/lib/supabase/server.ts`).
- SSR data helpers define explicit relation-rich types (`EventWithRelations`, `CommunityWithRelations`, `DiscussionWithRelations`) in `src/lib/supabase/server.ts`.
- Query keys are stable string arrays in React Query (`src/views/CommunityDetailClient.tsx`, `src/utils/queryKeys.ts`).

## Linting and Formatting Signals
- ESLint is TypeScript-first with React Hooks + React Refresh plugins (`eslint.config.js`).
- `@typescript-eslint/no-unused-vars` is disabled (`eslint.config.js`), so unused values are tolerated unless caught manually.
- Formatting is not fully uniform: `app/` files commonly use semicolons + single quotes, while many `src/` files omit semicolons and vary quote style (`app/page.tsx`, `src/components/ui/button.tsx`, `src/views/Index.tsx`).
