# SSR/CSR Hybrid Implementation Plan

**Last Updated:** January 29, 2026
**Branch:** `enhancement/ssr-development-jan`
**Framework:** Next.js 16.1.2 (App Router)
**Status:** Phase 1-4 Complete, Build Verified

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Status](#current-status)
3. [Implementation Phases](#implementation-phases)
4. [Verification & Testing](#verification--testing)

---

## Executive Summary

### What is a CSR/SSR Hybrid?

| Rendering | When Used | Benefits |
|-----------|-----------|----------|
| **SSR (Server-Side)** | Initial page load | SEO, faster FCP, works without JS |
| **CSR (Client-Side)** | After hydration | Interactivity, real-time updates, user-specific data |

### Goals

1. **SEO**: Search engines see fully rendered content with metadata
2. **Performance**: Faster initial page load (no client-side data fetching delay)
3. **Social Sharing**: Open Graph/Twitter cards work correctly
4. **Interactivity**: Full React interactivity after hydration
5. **User Data**: Client-side queries for authenticated/personalized content

### Current vs Target State

| Metric | Current | Target |
|--------|---------|--------|
| Pages with SSR | 7 of 10 | 7 of 10 ✅ |
| Detail pages with metadata | 3 of 3 | 3 of 3 ✅ |
| Proxy for auth | ✅ Done | ✅ Session refresh |
| Loading skeletons | 7 pages | All SSR pages ✅ |

### Data Fetching Strategy

| Data Type | Fetch Location | Example |
|-----------|----------------|---------|
| **Public content** | Server (SSR) | Event details, community info |
| **SEO metadata** | Server (generateMetadata) | Title, description, OG tags |
| **User-specific** | Client (CSR) | Registration status, membership |
| **Real-time** | Client (CSR) | Live attendee count, new comments |
| **Personalized** | Client (CSR) | Recommended events, user preferences |

---

## Current Status

### Page-by-Page Status

| Page | Type | Phase | SSR | Metadata | SEO DB | Loading | 404 |
|------|------|-------|-----|----------|--------|---------|-----|
| `/events/[id]` | Detail | 1 ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/communities/[id]` | Detail | 3 ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/discussions/[id]` | Detail | 3 ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/events` | Listing | 4 ✅ | ✅ | Static | N/A | ✅ | N/A |
| `/communities` | Listing | 4 ✅ | ✅ | Static | N/A | ✅ | N/A |
| `/discussions` | Listing | 4 ✅ | ✅ | Static | N/A | ✅ | N/A |
| `/` | Home | 4 ✅ | ✅ | Static | N/A | ✅ | N/A |

### Infrastructure Status

| Component | Phase | Status | Description |
|-----------|-------|--------|-------------|
| `proxy.ts` | 2 ✅ | ✅ Done | Session refresh for SSR auth (Next.js 16+ naming) |
| `getServerUser()` | 2 ✅ | ✅ Done | Server-side user access |
| `getServerSession()` | 2 ✅ | ✅ Done | Server-side session access |
| Server Supabase client | 1 ✅ | ✅ Done | `createServerSupabaseClient()` |
| SEO columns (events) | 1 ✅ | ✅ Done | 4 columns added |
| SEO columns (communities) | 3 ✅ | ✅ Done | 4 columns added (migration `20260130000001`) |
| SEO columns (discussions) | 3 ✅ | ✅ Done | 4 columns added (migration `20260130000001`) |

### Legend

- ✅ Complete and tested
- ❌ Not started
- ⏳ In progress

---

## Implementation Phases

---

## Phase 1: Foundation (✅ Complete)

**Status:** ✅ Complete
**Merged:** January 17, 2026
**Scope:** Event detail page SSR + SEO infrastructure

### Deliverables

| Item | Status | File(s) |
|------|--------|---------|
| Server Supabase client | ✅ | `src/lib/supabase/server.ts` |
| Event SSR page | ✅ | `app/events/[id]/page.tsx` |
| Event loading skeleton | ✅ | `app/events/[id]/loading.tsx` |
| Event 404 page | ✅ | `app/events/[id]/not-found.tsx` |
| Event client component | ✅ | `src/views/EventDetailClient.tsx` |
| SEO database columns | ✅ | Migration `20260117000001` |
| Database permissions | ✅ | Migration `20260117120000` |
| TypeScript types | ✅ | `src/integrations/supabase/types.ts` |

### Features Implemented

1. **Dynamic Metadata (`generateMetadata`)**
   - Page title from event title
   - Meta description from event description
   - Open Graph tags (Facebook, LinkedIn)
   - Twitter Card tags
   - Schema.org Event structured data (JSON-LD)

2. **SEO Override System**
   - `seo_title` - Custom title (falls back to `title`)
   - `seo_description` - Custom description (falls back to `description`)
   - `seo_image_url` - Custom OG image (falls back to `image_url`)
   - `seo_keywords` - Custom keywords array (falls back to derived)

3. **Server/Client Split**
   - Server Component fetches public event data
   - Client Component handles user interactions
   - Client queries for user-specific data (registration status)

---

## Phase 2: Infrastructure (✅ Complete)

**Status:** ✅ Complete
**Completed:** January 21, 2026
**Scope:** Proxy (middleware) + server auth utilities

### Why This Phase is Critical

Without proxy/middleware:
- SSR pages cannot reliably access authenticated user data
- Session tokens may expire causing auth failures
- No server-side route protection possible

### Deliverables

| Task | Priority | File(s) | Status |
|------|----------|---------|--------|
| Create proxy | P0 | `proxy.ts` | ✅ Done |
| Add `getServerUser()` | P1 | `src/lib/supabase/server.ts` | ✅ Done |
| Add `getServerSession()` | P1 | `src/lib/supabase/server.ts` | ✅ Done |
| Test proxy | P0 | Manual + automated | ✅ Done |

### Implementation Details

#### 2.1 Create Proxy (`proxy.ts`)

- **Location:** Project root (next to `package.json`)
- **Purpose:** Refresh Supabase session token on every request
- **Ensures:** SSR pages have valid auth cookies
- **Foundation for:** Future route protection
- **Note:** In Next.js 16+, `middleware.ts` was renamed to `proxy.ts`

#### 2.2 Server Auth Utilities

- **Added to:** `src/lib/supabase/server.ts`
- **Functions:** `getServerUser()`, `getServerSession()`
- **Returns:** User/session object or null if not authenticated
- **Best Practice:** Use `getServerUser()` for authorization checks (validates JWT with Supabase Auth server)

### Verification Completed

- [x] Proxy code runs without errors
- [x] Server auth utilities implemented
- [x] TypeScript compilation passes
- [x] Dev server starts successfully with proxy active

---

## Phase 3: Detail Pages (✅ Tested)

**Status:** ✅ SSR Tested (January 23, 2026)
**Estimated Effort:** 3-4 hours
**Scope:** SSR for community and discussion detail pages

> ⚠️ **SECURITY NOTE:** To enable SSR for discussions, public read RLS policies were added.
> See [Security Considerations](#security-considerations---rls-policies) section below.

### Deliverables

| Task | Priority | Files | Effort |
|------|----------|-------|--------|
| Community SSR page | P1 | `app/communities/[id]/page.tsx` | 45 min |
| Community loading skeleton | P1 | `app/communities/[id]/loading.tsx` | 20 min |
| Community 404 page | P1 | `app/communities/[id]/not-found.tsx` | 15 min |
| Community client component | P1 | `src/views/CommunityDetailClient.tsx` | 30 min |
| Discussion SSR page | P2 | `app/discussions/[id]/page.tsx` | 45 min |
| Discussion loading skeleton | P2 | `app/discussions/[id]/loading.tsx` | 20 min |
| Discussion 404 page | P2 | `app/discussions/[id]/not-found.tsx` | 15 min |
| Discussion client component | P2 | `src/views/DiscussionDetailClient.tsx` | 30 min |
| ~~(Optional) SEO columns for communities~~ | P3 ✅ | Migration `20260130000001` | ✅ Done |
| ~~(Optional) SEO columns for discussions~~ | P3 ✅ | Migration `20260130000001` | ✅ Done |

### Task Details

#### 3.1 Community Detail Page (`/communities/[id]`)

- **Current State:** Pure CSR with `'use client'`
- **Target State:** SSR with CSR hydration
- **Pattern:** Same as `/events/[id]` (Server Component → Client Component)
- **Metadata:** Community name, description, image for OG/Twitter

#### 3.2 Discussion Detail Page (`/discussions/[id]`)

- **Current State:** Pure CSR with `'use client'`
- **Target State:** SSR with CSR hydration
- **Pattern:** Same as `/events/[id]`
- **Metadata:** Discussion title, first 160 chars of content
- **Schema.org:** DiscussionForumPosting

### Database Changes (✅ Complete)

- ✅ Added `seo_title`, `seo_description`, `seo_image_url`, `seo_keywords` columns to `communities` and `discussions` tables
- Migration: `20260130000001_add_community_discussion_seo_columns.sql`
- Wired into `generateMetadata` in both detail pages

### Testing Results (January 23, 2026)

| Page | Test ID | SSR | Metadata |
|------|---------|-----|----------|
| `/communities/[id]` | `550e8400-e29b-41d4-a716-446655440010` | ✅ | ✅ Title, OG, Twitter |
| `/events/[id]` | `550e8400-e29b-41d4-a716-446655440030` | ✅ | ✅ + JSON-LD |
| `/discussions/[id]` | `550e8400-e29b-41d4-a716-446655440020` | ✅ | ✅ Title, OG, Twitter |

### Approval Checklist

- [x] Community page approach reviewed
- [x] Discussion page approach reviewed
- [x] SEO columns decision - ✅ Implemented (January 30, 2026)
- [x] SSR tested and working
- [ ] Security review of RLS policies (see [Security Considerations](#security-considerations---rls-policies))

---

## Phase 4: Listing Pages (✅ Complete)

**Status:** ✅ Complete (January 23, 2026)
**Estimated Effort:** 4-5 hours
**Scope:** SSR initial data for listing pages

### Deliverables (All Complete)

| Task | Priority | Files | Status |
|------|----------|-------|--------|
| Events listing SSR | P2 | `app/events/page.tsx` | ✅ |
| Events loading skeleton | P2 | `app/events/loading.tsx` | ✅ |
| Events client component | P2 | `src/views/Events.tsx` | ✅ |
| Communities listing SSR | P2 | `app/communities/page.tsx` | ✅ |
| Communities loading skeleton | P2 | `app/communities/loading.tsx` | ✅ |
| Communities client component | P2 | `src/views/Communities.tsx` | ✅ |
| Discussions listing SSR | P3 | `app/discussions/page.tsx` | ✅ |
| Discussions loading skeleton | P3 | `app/discussions/loading.tsx` | ✅ |
| Discussions client component | P3 | `src/views/Discussions.tsx` | ✅ |
| Home page SSR | P3 | `app/page.tsx` | ✅ |
| Home loading skeleton | P3 | `app/loading.tsx` | ✅ |

### Listing Page Pattern (Implemented)

- **SSR:** Fetch initial data on server (first 20 items, no filters)
- **CSR:** Pass initial data to Client Component as props
- **CSR:** Handle filters, search, pagination client-side with TanStack Query
- **Static Metadata:** Use static title/description (not dynamic per-item)

### Server Data Fetchers (Implemented)

| Function | Purpose | Status |
|----------|---------|--------|
| `getEvents(options)` | Fetch events list with limit | ✅ |
| `getCommunities(options)` | Fetch communities list with limit | ✅ |
| `getDiscussions(options)` | Fetch discussions list with limit | ✅ |
| `getHomePageData()` | Fetch featured content for home | ✅ |

### Build Verification (January 29, 2026)

Latest `next build` confirms all planned SSR routes as dynamic (server-rendered on demand):

```
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /api/test-auth
├ ○ /auth
├ ○ /auth/callback
├ ƒ /communities
├ ƒ /communities/[id]
├ ○ /dashboard
├ ƒ /discussions
├ ƒ /discussions/[id]
├ ƒ /events
├ ƒ /events/[id]
├ ○ /payment-success
├ ○ /profile
└ ○ /referrals

ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

### Completion Checklist

- [x] Listing page approach reviewed
- [x] Initial data strategy approved (20 items per page)
- [x] All pages converted to Server Components
- [x] All loading skeletons created
- [x] Build verified successfully

---

## Server Utilities Status

| Function | Phase | Status | Purpose |
|----------|-------|--------|---------|
| `createServerSupabaseClient()` | 1 | ✅ | Create SSR Supabase client |
| `getEventById(id)` | 1 | ✅ | Fetch event with relations |
| `getCommunityById(id)` | 3 | ✅ | Fetch community with relations |
| `getDiscussionById(id)` | 3 | ✅ | Fetch discussion with relations |
| `getServerUser()` | 2 | ✅ | Get authenticated user |
| `getServerSession()` | 2 | ✅ | Get current session |
| `getEvents(options)` | 4 | ✅ | Fetch events list |
| `getCommunities(options)` | 4 | ✅ | Fetch communities list |
| `getDiscussions(options)` | 4 | ✅ | Fetch discussions list |
| `getHomePageData()` | 4 | ✅ | Fetch featured home content |

---

## Database Schema - SEO Columns

### Events Table (✅ Complete)

| Column | Type | Fallback |
|--------|------|----------|
| `seo_title` | TEXT | `title` |
| `seo_description` | TEXT | `description.slice(0,160)` |
| `seo_image_url` | TEXT | `image_url` → `/logo.png` |
| `seo_keywords` | TEXT[] | Derived from title, tags, community |

### Communities & Discussions Tables (Phase 3 - Optional)

Same structure as events if approved.

---

## Verification & Testing

### Verification Methods

| Method | What to Check |
|--------|---------------|
| **Browser DevTools** | `<head>` section for `<title>`, `og:*`, `twitter:*` meta tags |
| **View Page Source** | Verify HTML is server-rendered (not just JS bundle) |
| **curl** | `curl -s [URL] \| grep -E '<title>\|og:\|twitter:'` |

### Social Media Preview Testing

| Platform | Tool |
|----------|------|
| Facebook | https://developers.facebook.com/tools/debug/ |
| Twitter | https://cards-dev.twitter.com/validator |
| LinkedIn | https://www.linkedin.com/post-inspector/ |
| Google | https://search.google.com/test/rich-results |

---

## Troubleshooting

| Issue | Symptom | Solution |
|-------|---------|----------|
| No meta tags | Page loads but no SEO tags | Ensure no `'use client'` at top; check `generateMetadata` export |
| 401 from Supabase | Data fetch fails | Check env vars; run permissions migration |
| SEO columns missing | Error on select | Apply SEO columns migration; regenerate types |
| Blank loading | No skeleton shown | Ensure `loading.tsx` in same folder as `page.tsx` |
| Remote not updated | Works locally only | Apply migration via Supabase Dashboard SQL Editor |

---

## Security Considerations - RLS Policies

> ⚠️ **WARNING:** The following RLS policies were added to enable anonymous SSR data fetching.
> These policies change the security model and should be reviewed before production deployment.

### Risky Policies Created

| Location | Table | Policy Name | Risk Level |
|----------|-------|-------------|------------|
| **PRODUCTION** | `discussions` | `"Public can view visible discussions"` | ⚠️ MEDIUM |
| **LOCAL** | `discussions` | `"Allow public read of visible discussions"` | ⚠️ MEDIUM |

### Security Implications

1. **Bypasses Community Membership**: Original policy required `is_community_member(auth.uid(), community_id)`. New policy allows anyone to read discussions where `is_visible = true`.

2. **Data Exposure**: Discussion titles, prompts, creator IDs, and related user info become publicly accessible.

3. **Enumeration Risk**: Attackers can scrape all visible discussion content without authentication.

4. **No Audit Trail**: Anonymous requests lack `auth.uid()` for access tracking.

### Recommended Fix

**Remove public policies and use service_role key for SSR instead:**

```sql
-- Remove risky policies
DROP POLICY "Public can view visible discussions" ON discussions;  -- Production
DROP POLICY "Allow public read of visible discussions" ON discussions;  -- Local
```

**Then implement service_role client for SSR:**

```typescript
// src/lib/supabase/server.ts - For SSR data fetching only
function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Never expose this key
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

This approach:
- Keeps original RLS policies intact for client-side security
- Only server can bypass RLS (not exposed to browser)
- No public data exposure
