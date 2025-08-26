# Product Overview

Name: The Third Place
Goal: Help people in metro cities discover communities and join events, reducing urban loneliness.

## What the product does today
- Communities: Browse and join communities (free). Mobile-first discovery UI with Material UI navigation.
- Events: View details and register. Paid events use Cashfree; free events register directly.
- Discussions: Admin-created, time-bound threads per community; comment access gated to members.
- Referrals: Code-based referral flow per spec (copy code-only; shown in sign-up, hidden in sign-in; post-OAuth modal).
- Auth: Google OAuth via Supabase Auth; session handling and protected routes.
- Email: Welcome email system via Supabase Edge Functions + Resend with delivery logs and idempotency.
- Webhooks: Infrastructure and dispatcher implemented; dispatches queued events to external endpoints (admin UI pending in Admin Panel).
- Activity logging: Edge function and storage present; some passive logs intentionally disabled to reduce noise until analytics UI lands.

## Tech stack & architecture
- Frontend: React + TypeScript + Tailwind + Material UI patterns; mobile-first
- Backend: Supabase (Postgres, RLS, Auth, Storage) with Edge Functions
- Payments: Cashfree (Edge Functions for create/verify/callback)
- Email: Resend via Supabase Edge Function
- Integrations: Outbound webhooks (n8n compatible) via queue + dispatcher

## Roles
- User: Browse, join communities, register for events, comment in joined-community discussions.
- Host: One host per event; host is a community member; gets a “host” badge.
- Admin: Moderation and analytics (Admin Panel app planned), manages communities/events/discussions.

## Principles
- API-first with Supabase Edge Functions; outbound webhooks for integrations (n8n, etc.)
- Modular and swappable components (payments, comms)
- Privacy by default (e.g., participant lists are backend-only by default)

