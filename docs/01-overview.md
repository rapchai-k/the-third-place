# Product Overview

**Name:** The Third Place  
**Goal:** Help users in metro cities discover communities and join paid events; reduce urban loneliness.  
**Base unit:** Community → has Events & Discussions.  
**Join & Pay:** Users join communities (free). Users pay to register for events (Cashfree).  
**Discussions:** Admin-created, time-bound threads per community; auto-close; visibility toggle.

### Roles
- **User:** browse, join communities, register for events, comment in joined-community discussions.
- **Host:** one host per event; host is a community member; gets a “host” badge.
- **Admin:** full CRUD on communities/events/discussions/users; moderation; analytics.

### Principles
- **API-first** (REST) with webhooks for n8n.
- **Modular & swappable** components (payments, storage, comms).
- **Privacy:** event participants list is backend-only by default.
