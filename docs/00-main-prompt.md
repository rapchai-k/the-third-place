# 🧠 Lovable Prompt: The Third Place

This project is for **The Third Place**, a curated platform where like-minded individuals join city-based communities, participate in offline events, and engage in focused, time-bound discussions. It is designed to foster real-world connections by building niche-interest micro-communities.

---

## 🔧 Architecture Overview

This is a **Supabase-first** app with a full REST backend and rich React frontend using the following:

- Supabase: Auth, RLS-secured Postgres DB, Storage
- REST APIs: Designed with “where it's used” approach
- n8n-compatible: All events/actions emit webhook-compatible data
- React 18 + Vite + ShadCN + Tailwind UI
- Admin panel hosted on `admin.mythirdplace`
- Circular Gallery for image carousel ([ReactBits Circular Gallery](https://reactbits.dev/components/circular-gallery))
- Tilted Cards for Event/Community preview ([ReactBits Tilted Card](https://reactbits.dev/components/tilted-card))

---

## 📁 Prompt File Structure

- `01-overview.md`: Product concept, user roles, modules
- `01-rest-contracts.md`: Full list of REST API endpoints
- `01-seed-data.json`: Sample users, communities, tags, events, discussion threads
- `01-theme.css`: Full Tailwind-compatible theme variables
- `01-ui-spec.md`: Page-level UX mapping (User and Admin flows)
- `01-uml.puml`: UML entity diagram
- `02-env.md`: Env variable expectations (OAuth, Webhooks)
- `02-error-envelope.md`: Standard error shape & failure handling conventions
- `02-shadcn-setup.md`: Preinstalled ShadCN components + CLI scaffolding
- `02-ux-component-map.md`: Component selection map (ReactBits + ShadCN)
- `03-rls-policies.sql`: All access rules as per RLS
- `03-webhooks.md`: Events and payload structure for n8n webhook triggers

---

## 🎯 Execution Requirements

1. Use Supabase Auth (Google OAuth as primary)
2. Enable RLS on all tables; see `03-rls-policies.sql`
3. Implement analytics tracking of all user actions (joins, posts, referrals, etc.)
4. Ensure privacy: event participants not exposed to frontend unless toggled
5. Auto-expiring discussions with admin override
6. Role-based flagging and banning with dynamic threshold
7. Graceful error handling with `02-error-envelope.md`
8. All features must work in both light/dark modes using `01-theme.css`

---

## 🧪 Developer Notes

- Admins are the only users who can create communities, events, or discussions
- Hosts are manually assigned per event from existing community members
- Users can express interest in upcoming events (not live) without payment
- Payments, registration, and state changes must reflect in UI
- Use `/internal/comms/preferences` for user notification settings
- Events can have multiple tags and be filtered by city, tags, or community
- Referral tracking and badge systems are extendable but not MVP-critical

---

## 💻 Output Expectations

- Supabase schema and SQL RLS setup
- REST API scaffold
- React frontend components
- Admin dashboard on subdomain
- Seeded test data
- Webhook trigger support
- UI theming via CSS variables
- Error handling envelope
- Type-safe codebase with sensible fallback UX

---

## 🚨 Do Not:

- Generate random copy — use provided seed only
- Build comms logic — only scaffold webhook-ready placeholders
- Allow user-level CRUD on communities or events
- Include group chat or DMs
