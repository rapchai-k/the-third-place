# User Flows

This document outlines the core user journeys within "The Third Place".

## 1. Authentication Flow
**Goal**: Securely sign in users via Google OAuth.

1. **Initiation**: User clicks "Sign In" on landing page or "Join" on a protected action.
2. **Provider**: Redirects to Google OAuth via Supabase Auth.
3. **Callback**: Returns to `/auth/callback` which exchanges code for session.
4. **Onboarding Check**: 
   - If new user -> Insert into `users` table via trigger -> Send Welcome Email (`welcome-email-trigger`).
   - If existing user -> Update last login timestamp.
5. **Redirection**: User lands on `/` or the intended protected route.

## 2. Event Discovery & Registration
**Goal**: Discover a community event and secure a spot.

1. **Discovery**: 
   - User browses `/events` (filterable by city, tags).
   - Clicks an event card to view `/events/:id`.
2. **Registration Intent**:
   - User clicks "Register" (or "Pay ₹X").
   - System checks auth status (redirects if null).
3. **Payment/Registration**:
   - **Free Event**: Immediate registration in `event_registrations`.
   - **Paid Event**:
     - Calls `create-payment` Edge Function.
     - User redirected to Razorpay Payment Link.
     - On success, redirected to `/payment-success`.
     - Webhook (`payment-callback`) confirms payment and creates registration.
4. **Confirmation**:
   - UI shows "Registered" status on event page.
   - User receives confirmation email (future).

## 3. Community Membership & Discussions
**Goal**: Join a tribe and participate in conversations.

1. **Join**:
   - User views `/communities/:id`.
   - Clicks "Join Community".
   - `community_members` record created.
   - UI updates to show "Member" badge.
2. **Discussion Access**:
   - Member navigates to "Discussions" tab.
   - Views member-only threads.
3. **Participation**:
   - Opens a thread (`/discussions/:id`).
   - Posts a comment.
   - RLS policy verifies membership before allowing insert.
   - Real-time subscription (optional) updates UI.
