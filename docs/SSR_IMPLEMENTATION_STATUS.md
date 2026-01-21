# SSR/CSR Hybrid Implementation Plan

**Last Updated:** January 21, 2026
**Branch:** `enhancement/ssr-development-jan`
**Framework:** Next.js 16.1.2 (App Router)
**Status:** Phase 1-2 Complete, Phases 3-4 Pending Approval

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
| Pages with SSR | 1 of 10 | 7 of 10 |
| Detail pages with metadata | 1 of 3 | 3 of 3 |
| Proxy for auth | ✅ Done | ✅ Session refresh |
| Loading skeletons | 1 page | All SSR pages |

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
| `/communities/[id]` | Detail | 3 | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/discussions/[id]` | Detail | 3 | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/events` | Listing | 4 | ❌ | Static | N/A | ❌ | N/A |
| `/communities` | Listing | 4 | ❌ | Static | N/A | ❌ | N/A |
| `/discussions` | Listing | 4 | ❌ | Static | N/A | ❌ | N/A |
| `/` | Home | 4 | ❌ | Static | N/A | ❌ | N/A |

### Infrastructure Status

| Component | Phase | Status | Description |
|-----------|-------|--------|-------------|
| `proxy.ts` | 2 ✅ | ✅ Done | Session refresh for SSR auth (Next.js 16+ naming) |
| `getServerUser()` | 2 ✅ | ✅ Done | Server-side user access |
| `getServerSession()` | 2 ✅ | ✅ Done | Server-side session access |
| Server Supabase client | 1 ✅ | ✅ Done | `createServerSupabaseClient()` |
| SEO columns (events) | 1 ✅ | ✅ Done | 4 columns added |
| SEO columns (communities) | 3 | ❌ Pending | Optional |
| SEO columns (discussions) | 3 | ❌ Pending | Optional |

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

## Phase 3: Detail Pages (⏳ Pending)

**Status:** ⏳ Pending Approval
**Estimated Effort:** 3-4 hours
**Scope:** SSR for community and discussion detail pages

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
| (Optional) SEO columns for communities | P3 | Migration | 20 min |
| (Optional) SEO columns for discussions | P3 | Migration | 20 min |

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

### Database Changes (Optional)

- Add `seo_title`, `seo_description`, `seo_image_url`, `seo_keywords` columns to `communities` and `discussions` tables
- Decision: Yes 

### Approval Checklist

- [ ] Community page approach reviewed
- [ ] Discussion page approach reviewed
- [ ] SEO columns decision (yes/no/later)
- [ ] Ready to proceed

---

## Phase 4: Listing Pages (⏳ Pending)

**Status:** ⏳ Pending Approval
**Estimated Effort:** 4-5 hours
**Scope:** SSR initial data for listing pages

### Deliverables

| Task | Priority | Files | Effort |
|------|----------|-------|--------|
| Events listing SSR | P2 | `app/events/page.tsx` | 45 min |
| Events loading skeleton | P2 | `app/events/loading.tsx` | 20 min |
| Events client component | P2 | `src/views/EventsClient.tsx` | 30 min |
| Communities listing SSR | P2 | `app/communities/page.tsx` | 45 min |
| Communities loading skeleton | P2 | `app/communities/loading.tsx` | 20 min |
| Communities client component | P2 | `src/views/CommunitiesClient.tsx` | 30 min |
| Discussions listing SSR | P3 | `app/discussions/page.tsx` | 45 min |
| Discussions loading skeleton | P3 | `app/discussions/loading.tsx` | 20 min |
| Discussions client component | P3 | `src/views/DiscussionsClient.tsx` | 30 min |
| Home page SSR | P3 | `app/page.tsx` | 45 min |
| Home loading skeleton | P3 | `app/loading.tsx` | 20 min |

### Listing Page Pattern

- **SSR:** Fetch initial data on server (first 20 items, no filters)
- **CSR:** Pass initial data to Client Component as props
- **CSR:** Handle filters, search, pagination client-side with TanStack Query
- **Static Metadata:** Use static title/description (not dynamic per-item)

### Server Data Fetchers Needed

| Function | Purpose |
|----------|---------|
| `getEvents(options)` | Fetch events list with limit |
| `getCommunities(options)` | Fetch communities list with limit |
| `getDiscussions(options)` | Fetch discussions list with limit |

### Approval Checklist

- [ ] Listing page approach reviewed
- [ ] Initial data strategy approved (how much to SSR)
- [ ] Ready to proceed

---

## Server Utilities Status

| Function | Phase | Status | Purpose |
|----------|-------|--------|---------|
| `createServerSupabaseClient()` | 1 | ✅ | Create SSR Supabase client |
| `getEventById(id)` | 1 | ✅ | Fetch event with relations |
| `getCommunityById(id)` | 1 | ✅ | Fetch community (ready, unused) |
| `getDiscussionById(id)` | 1 | ✅ | Fetch discussion (ready, unused) |
| `getServerUser()` | 2 | ✅ | Get authenticated user |
| `getServerSession()` | 2 | ✅ | Get current session |
| `getEvents(options)` | 4 | ❌ | Fetch events list |
| `getCommunities(options)` | 4 | ❌ | Fetch communities list |
| `getDiscussions(options)` | 4 | ❌ | Fetch discussions list |

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
