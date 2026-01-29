# Analytics Implementation Summary

## Branch: `enhancement/analytics-post-ssr`

This branch implements comprehensive GA4/GTM analytics tracking for all major user interactions in the application, following the manual-events architecture defined in `docs/GA4_ANALYTICS_PLAN.md`.

## Changes Overview

### 1. Enhanced Analytics Utility (`src/utils/analytics.ts`)

Added the following tracking methods:

#### E-commerce Events (Phase 4)
- **`viewItem()`** - Track event detail page views with item details
- **`beginCheckout()`** - Track payment initiation with transaction details
- **`purchase()`** - Track successful payments with transaction ID
- **`refund()`** - Track refunds/cancellations (prepared for future use)

#### Community & Engagement Events (Phase 5)
- **`joinCommunity()`** - Track community joins
- **`leaveCommunity()`** - Track community leaves
- **`viewCommunity()`** - Track community page views
- **`createDiscussion()`** - Track discussion creation
- **`createComment()`** - Track comment creation
- **`viewDiscussion()`** - Track discussion page views
- **`search()`** - Track search queries

All methods follow GA4 event naming conventions and push structured data to `window.dataLayer`.

### 2. Authentication Tracking

#### Email Authentication (`src/views/Auth.tsx`)
- Added `analytics.login('email', userId)` on successful email sign-in
- Added `analytics.signUp('email', userId)` on successful email registration

#### OAuth Authentication (`src/views/AuthCallback.tsx`)
- Added logic to detect new vs. existing users
- Track `analytics.signUp('google', userId)` for new users
- Track `analytics.login('google', userId)` for returning users

#### Logout (`src/contexts/AuthContext.tsx`)
- Added `analytics.clearUser()` on sign out to clear user properties

### 3. E-commerce Tracking

#### Event Detail Page (`src/views/EventDetailClient.tsx`)
- Track `view_item` when event page loads
- Includes event ID, name, price, currency, and category

#### Payment Flow (`src/components/PaymentButton.tsx`)
- Track `begin_checkout` when payment is initiated
- Track `purchase` when payment is successfully verified
- Includes transaction ID, items array, and total value

### 4. Community Engagement Tracking

#### Community Pages (`src/views/CommunityDetailClient.tsx`)
- Track `view_community` when community page loads
- Track `join_community` when user joins
- Track `leave_community` when user leaves
- Includes community ID, name, city, and member count

#### Discussion Pages (`src/views/DiscussionDetailClient.tsx`)
- Track `view_discussion` when discussion page loads
- Includes discussion ID, title, and community ID

#### Comments (`src/components/CommentForm.tsx`)
- Track `create_comment` when comment is posted
- Includes comment ID, discussion ID, and comment length

#### Search (`src/views/Discussions.tsx`)
- Track `search` when user performs a search
- Includes search term, type, and results count

## Data Flow Architecture

All events follow the manual-events pattern:

```
User Action → analytics.method() → window.dataLayer.push() → GTM → GA4
```

- **No direct GA4 calls** - All tracking goes through GTM
- **SSR-safe** - All analytics calls include `typeof window` checks
- **Debug mode** - Console logging in development environment
- **Consistent naming** - Follows GA4 recommended event names

## Next Steps for GTM Configuration

To complete the implementation, configure GTM with:

### For Each Event Type:
1. **Data Layer Variables** - Create DLVs for event parameters
2. **Custom Event Trigger** - Create trigger for the event name
3. **GA4 Event Tag** - Create tag to forward to GA4 with parameters

### Example for `join_community`:
- DLVs: `dlv - community_id`, `dlv - community_name`, `dlv - community_city`
- Trigger: Custom Event = `join_community`
- Tag: GA4 Event with event name `join_community` and mapped parameters

## Testing Checklist

- [ ] Use GTM Preview mode to verify events fire correctly
- [ ] Check GA4 Realtime to confirm events appear
- [ ] Verify all parameters are captured correctly
- [ ] Test authentication flows (email & Google OAuth)
- [ ] Test payment flow end-to-end
- [ ] Test community join/leave
- [ ] Test discussion and comment creation
- [ ] Test search functionality

## Files Modified

1. `src/utils/analytics.ts` - Added 10 new tracking methods
2. `src/views/Auth.tsx` - Added login/signup tracking
3. `src/views/AuthCallback.tsx` - Added OAuth tracking
4. `src/contexts/AuthContext.tsx` - Added logout tracking
5. `src/views/EventDetailClient.tsx` - Added view_item tracking
6. `src/components/PaymentButton.tsx` - Added checkout/purchase tracking
7. `src/views/CommunityDetailClient.tsx` - Added community tracking
8. `src/views/DiscussionDetailClient.tsx` - Added discussion view tracking
9. `src/components/CommentForm.tsx` - Added comment tracking
10. `src/views/Discussions.tsx` - Added search tracking

## Commit Message

```
feat: wire up comprehensive GA4/GTM analytics events

Add analytics tracking for all major user interactions:

Authentication Events:
- Track login (email & Google OAuth)
- Track sign up (email & Google OAuth)
- Track logout with clearUser

E-commerce Events:
- Track view_item on event detail pages
- Track begin_checkout on payment initiation
- Track purchase on successful payment
- Add refund method for future use

Community & Engagement Events:
- Track join_community
- Track leave_community
- Track view_community
- Track create_discussion (method added)
- Track create_comment
- Track view_discussion
- Track search queries

All events push to dataLayer for GTM processing per the manual-events architecture.
```

