# App Router + SSR Migration Tracker

This document tracks the migration from the legacy Vite + React Router SPA to a single **Next.js App Router + SSR hybrid** frontend.

## Legend

- `[ ]` Not started
- `[/]` In progress
- `[x]` Done
- `[-]` Not applicable

---

## Phase Checklist (High-Level)

### Phase 0 – Pre-checks
- [x] App is run only via **Next dev/start** (`npm run dev`), not Vite.
- [x] All key routes work via `http://localhost:3000`:
  - `/`, `/events`, `/communities`, `/discussions`
  - `/events/[id]`, `/communities/[id]`, `/discussions/[id]`
  - `/auth`, `/auth/callback`, `/dashboard`, `/profile`, `/referrals`, `/payment-success`

#### Verification for Phase 0
- You can start the app with `npm run dev` and see **Next.js** logs (no `vite` dev server running in parallel).
- Visiting `http://localhost:8080` (old Vite port) does **not** serve the app.
- All key routes above return a 200 and render the expected screens when opened directly in the browser address bar (no client-side redirect from `/`).

### Phase 1 – Implement SSR Hybrid for Core Content Routes
For each route, the goal is:
- App Router `app/.../page.tsx` is a **Server Component** (no `'use client'`).
- It fetches **public data on the server**.
- It renders a **client view** in `src/views/...` (or `*Client.tsx`) with initial data via props.

- [x] `/` – Home
- [x] `/events`
- [x] `/communities`
- [x] `/discussions`
- [x] `/events/[id]`
- [x] `/communities/[id]`
- [x] `/discussions/[id]`

#### Verification for Phase 1
- For each checked route:
  - The corresponding `app/.../page.tsx` file has **no** `'use client'` directive.
  - Hitting the route directly (e.g. `curl http://localhost:3000/events`) returns HTML that already contains the main list/detail content **before** JavaScript runs.
  - In the browser DevTools Network tab, the initial document load contains the key data in the HTML; React Query or client fetches are only used for **user-specific** or incremental updates.
  - There are no client-side 404s or flashes of empty state when loading the route via a full page refresh.

### Phase 2 – Switch Detail Pages to `*Client` Components

- [x] `app/events/[id]/page.tsx` uses `EventDetailClient` + server-side `getEventById`
- [x] `app/communities/[id]/page.tsx` uses `CommunityDetailClient` + server-side fetcher
- [x] `app/discussions/[id]/page.tsx` uses `DiscussionDetailClient` + server-side fetcher
- [x] Old SPA detail views are no longer imported by App Router:
  - [x] `src/views/EventDetail.tsx`
  - [x] `src/views/CommunityDetail.tsx`
  - [x] `src/views/DiscussionDetail.tsx`

#### Verification for Phase 2
- Each dynamic detail page imports and renders the corresponding `*Client` component (not the old `EventDetail` / `CommunityDetail` / `DiscussionDetail`).
- Server-side fetchers (`getEventById`, etc.) are called from `app/.../[id]/page.tsx`, and `notFound()` is used for missing records.
- Opening a detail URL directly in a fresh browser tab shows the correct content with **no extra client-side redirect** and no long “loading” flash.
- Searching the codebase shows the old SPA detail views are **only** referenced in this tracker or comments (no longer imported from any `app/*` file).

### Phase 3 – Decommission React Router / Vite SPA

- [x] Confirm `src/App.tsx` is not used for any live routing.
- [x] Stop running Vite dev server for user app.
- [x] Safe to delete SPA stack:
  - [x] `index.html`
  - [x] `src/main.tsx`
  - [x] `src/App.tsx`
  - [x] `src/views/NotFound.tsx`
  - [x] Any views only used by `src/App.tsx` and not by `app/*`.

#### Verification for Phase 3
- Grepping for `BrowserRouter`, `Routes`, or `Route` shows no usages in the shipping app code (only in this doc or historical references).
- `npm run build` / `next build` completes successfully after the SPA files are removed.
- Running the app and clicking through all main routes works without any 404s or missing screens that previously depended on React Router.
- There is no way to reach the old SPA entrypoint (no URL or script tag pointing to `index.html`, `src/main.tsx`, or `src/App.tsx`).

### Phase 4 – Refinement (Optional, Post-Migration)

- [ ] Move additional public data fetching from client views into server `app/.../page.tsx` components where appropriate.
- [ ] Ensure `PageSuspenseWrapper` is used where `useSearchParams` and streaming are needed.
- [ ] Update `docs/SSR_IMPLEMENTATION_STATUS.md` to match reality.

#### Verification for Phase 4
- For routes you’ve refined, viewing the page source shows most public data rendered server-side, with client fetches reserved for personalized or highly dynamic content.
- JS bundle sizes and the number of initial XHR/fetch calls are reduced compared to the original client-only implementation (can be checked via DevTools / build analyzer, if configured).
- `docs/SSR_IMPLEMENTATION_STATUS.md` and this tracker both reflect the actual implementation (no routes marked as SSR that still rely entirely on client fetching).

---

## Route-by-Route Status

### Core Content Routes

Goal per row: **Server SSR page + client view + no dependency on React Router**.

| Route              | App Router page                 | Server data? | Client view                          | Legacy SPA view removed? | Status |
| ------------------ | --------------------------------| ------------ | ------------------------------------- | ------------------------- | ------ |
| `/`                | `app/page.tsx`                  | [x]          | `src/views/Index.tsx`                | N/A                       | [x]    |
| `/events`          | `app/events/page.tsx`           | [x]          | `src/views/Events.tsx`               | [x] (from `src/App.tsx`)  | [x]    |
| `/communities`     | `app/communities/page.tsx`      | [x]          | `src/views/Communities.tsx`          | [x]                       | [x]    |
| `/discussions`     | `app/discussions/page.tsx`      | [x]          | `src/views/Discussions.tsx`          | [x]                       | [x]    |
| `/events/[id]`     | `app/events/[id]/page.tsx`      | [x]          | `EventDetailClient` (target)         | [x] (`EventDetail.tsx`)   | [x]    |
| `/communities/[id]`| `app/communities/[id]/page.tsx` | [x]          | `CommunityDetailClient` (target)     | [x] (`CommunityDetail.tsx`)| [x]   |
| `/discussions/[id]`| `app/discussions/[id]/page.tsx` | [x]          | `DiscussionDetailClient` (target)    | [x] (`DiscussionDetail.tsx`)| [x]  |

### Auth & Account Routes

These are expected to remain **client-heavy pages** under App Router, but should not depend on React Router.

| Route            | App Router page              | View component                | Uses ProtectedRoute? | Status |
| ---------------- | ---------------------------- | ----------------------------- | -------------------- | ------ |
| `/auth`          | `app/auth/page.tsx`          | `src/views/Auth.tsx`         | [-]                  | [x]    |
| `/auth/callback` | `app/auth/callback/page.tsx` | `src/views/AuthCallback.tsx` | [-]                  | [x]    |
| `/dashboard`     | `app/dashboard/page.tsx`     | `src/views/Dashboard.tsx`    | [x]                  | [x]    |
| `/profile`       | `app/profile/page.tsx`       | `src/views/Profile.tsx`      | [x]                  | [x]    |
| `/referrals`     | `app/referrals/page.tsx`     | `src/views/ReferralCenter.tsx`| [x]                 | [x]    |
| `/payment-success`| `app/payment-success/page.tsx`| `src/views/PaymentSuccess.tsx`| [-]                | [x]    |

---

## Deletable Legacy Artifacts (Once Conditions Are Met)

Use this as a final cleanup checklist after Phases 1–3 are complete.

- [x] `index.html` – legacy Vite SPA entry. ✅ DELETED
- [x] `src/main.tsx` – Vite React root. ✅ DELETED
- [x] `src/App.tsx` – React Router config. ✅ DELETED
- [x] `src/views/NotFound.tsx` – SPA 404 (replaced by `app/not-found.tsx`). ✅ DELETED
- [x] `src/views/EventDetail.tsx` – old detail view, replaced by SSR + `EventDetailClient`. ✅ DELETED
- [x] `src/views/CommunityDetail.tsx` – old detail view, replaced by SSR + `CommunityDetailClient`. ✅ DELETED
- [x] `src/views/DiscussionDetail.tsx` – old detail view, replaced by SSR + `DiscussionDetailClient`. ✅ DELETED
- [x] Any other view used **only** by `src/App.tsx` and never by `app/*`. ✅ N/A

