# PostHog Integration Plan

> **Status: Future Enhancement** — PostHog is not yet integrated. This doc captures the agreed-upon approach for when we're ready to implement it.

The project already has a GA4/GTM analytics layer in `src/utils/analytics.ts`. The goal is to add PostHog **alongside** it — not replace it — to get session replay, funnels, feature flags, and heatmaps on top of what GA4 already provides.

## Why PostHog

| Feature | GA4/GTM | PostHog |
|---|---|---|
| Page views & traffic | ✅ | ✅ |
| Funnels & retention | ⚠️ Basic | ✅ Powerful |
| Session replay | ❌ | ✅ |
| Feature flags | ❌ | ✅ |
| A/B testing | ❌ | ✅ |
| Heatmaps | ❌ | ✅ |
| Per-user event timelines | ❌ | ✅ |

---

## Events to Track

| Area | PostHog Event Names |
|---|---|
| Auth | `user_signed_in`, `user_signed_up`, `user_signed_out` |
| Page Views | `$pageview` (automatic) |
| Events | `event_viewed`, `event_registered`, `event_registration_cancelled`, `payment_initiated`, `payment_completed`, `payment_failed` |
| Communities | `community_viewed`, `community_joined`, `community_left` |
| Discussions | `discussion_viewed`, `discussion_created`, `comment_created`, `comment_flagged` |
| Profile | `profile_edited` |

---

## Implementation Steps

### 1. Install

```bash
npm install posthog-js
```

### 2. Environment Variables

Add to `.env.local`:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 3. [NEW] `src/lib/posthog.ts`

```ts
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false, // handled manually via usePageTracking
    capture_pageleave: true,
    session_recording: { maskAllInputs: true },
  })
}

export { posthog }
```

### 4. [NEW] `src/components/PostHogProvider.tsx`

A `'use client'` wrapper that:
- Wraps children with `PHProvider` from `posthog-js/react`
- Includes a `PageViewTracker` inner component that fires `$pageview` on every route change using `usePathname` + `useSearchParams`

### 5. [MODIFY] `app/layout.tsx`

Wrap the app tree with `<PostHogProvider>`.

### 6. [MODIFY] `src/contexts/AuthContext.tsx`

On `SIGNED_IN` / `TOKEN_REFRESHED`:
```ts
posthog.identify(session.user.id, {
  email: session.user.email,
  auth_provider: session.user.app_metadata?.provider || 'email',
})
```

On sign-out:
```ts
posthog.reset()
```

### 7. [MODIFY] `src/utils/analytics.ts`

Add a `posthog.capture(...)` call alongside every existing `pushToDataLayer(...)`. No changes needed to any call sites. Mapping:

| GA4 method | PostHog event |
|---|---|
| `pageView` | `$pageview` |
| `login` | `user_signed_in` |
| `signUp` | `user_signed_up` |
| `viewItem` | `event_viewed` |
| `beginCheckout` | `payment_initiated` |
| `purchase` | `payment_completed` |
| `refund` | `payment_refunded` |
| `joinCommunity` | `community_joined` |
| `leaveCommunity` | `community_left` |
| `viewCommunity` | `community_viewed` |
| `createDiscussion` | `discussion_created` |
| `createComment` | `comment_created` |
| `viewDiscussion` | `discussion_viewed` |
| `search` | `search_performed` |

---

## Verification Checklist

- [ ] PostHog Live Events shows `$pageview` on navigation
- [ ] Sign-in creates an identified person in PostHog
- [ ] Payment funnel events fire correctly
- [ ] `community_joined` fires on joining
- [ ] Sign-out resets to anonymous distinct ID
