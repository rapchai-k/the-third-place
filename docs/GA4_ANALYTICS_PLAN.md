# GA4 / GTM Analytics Plan – Manual Events Architecture

**Project:** My Third Place
**Updated:** January 2026 (manual-only GA4 via GTM)
**Owner:** Development Team

---

## 1. Overview & Goals

- Primary: Track behavior, engagement, and conversions across the platform
- Secondary: Use SSR + App Router for accurate analytics
- Tertiary: Keep data clean (no double-counting, no noisy auto-events)

### Key Metrics

| Category    | Examples                                        |
|------------|--------------------------------------------------|
| Acquisition| Sign-ups, referral conversions, traffic sources  |
| Engagement | Communities joined, events viewed, discussions   |
| Conversion | Event registrations, payment completions         |
| Revenue    | Registration revenue, AOV, refunds               |

---

## 2. Architecture (Manual Events Model)

Event flow:
```
User Action → analytics.* → dataLayer → GTM (tags) → GA4
```

**Principles**
- App only calls analytics.* → pushes objects into `window.dataLayer`
- GTM owns all routing to GA4 (and any other tools)
- Events without GTM tags never reach GA4 (by design)
- Page views use custom event name `tp_page_view` → mapped to `page_view` in GTM

### Environment
- `NEXT_PUBLIC_GTM_ID=GTM-ND6D4RDP` (only analytics env var in app)
- GA4 Measurement ID is stored **only in GTM**
- No `NEXT_PUBLIC_GA4_ID` in any env file

---

## 3. Current Status

### Quick Status Overview
```
OVERALL PROGRESS: ▰▱▱▱▱▱▱▱ 12.5% (Phase 1 in progress)

CURRENT PHASE: Phase 1 - Foundation Setup (6/12 tasks complete)
BLOCKING ISSUES: GA4 property not yet created (need Measurement ID in GTM)
NEXT ACTION: Create GA4 property, configure GA4 config + page_view tags in GTM, test in Preview, publish, verify in GA4 Realtime
```

### Phase Progress

| Phase | Name              | Status           | Progress | Blockers                  |
|-------|-------------------|------------------|----------|---------------------------|
| 1     | Foundation        | 🟡 IN PROGRESS   | 6/12     | Need GA4 property + GTM   |
| 2     | Authentication    | ⬜ NOT STARTED    | 0/10     | Phase 1 complete          |
| 3     | SSR Enhancement   | ⬜ NOT STARTED    | 0/10     | Phase 1 complete          |
| 4     | E‑commerce        | ⬜ NOT STARTED    | 0/12     | Phase 2 complete          |
| 5     | Engagement        | ⬜ NOT STARTED    | 0/14     | Phase 2 complete          |
| 6     | Custom Dimensions | ⬜ NOT STARTED    | 0/8      | Phases 2,5 complete       |
| 7     | Privacy           | ⬜ NOT STARTED    | 0/10     | Phase 1 complete          |
| 8     | Advanced          | ⬜ NOT STARTED    | 0/10     | All core phases complete  |

#### How to maintain this tracker (for agents)
- When you complete or change a task, first update the checkbox and notes in
  **9. Detailed Task Checklist** (T1.x, T2.x, …).
- Then update the **Progress** column in the table above so counts (e.g. 6/12)
  match the number of completed tasks for that phase.
- Finally, adjust the **Quick Status Overview** block (overall progress bar,
  current phase, blocking issues, next action) to reflect the new reality.

### Phase 1 – Foundation (Current Work)
- Completed: GTM container, env vars (GTM only), `analytics.ts`, `usePageTracking`, GTM components, layout integration.
- Pending: GA4 property; GA4 config tag in GTM; dataLayer variables; GTM Preview tests; publish; GA4 Realtime verification.

---

## 4. Page View Tracking Contract

**App behavior (`src/utils/analytics.ts` → `analytics.pageView`):**
- Pushes an object to `dataLayer` with:
  - `event: 'tp_page_view'`
  - `page_location`: full URL
  - `page_path`: pathname (optionally + query)
  - `page_title`: `document.title`
  - optional: `content_type`, `content_id`

**GTM configuration for page_view:**
1. GA4 Configuration tag
   - Type: GA4 Configuration
   - Measurement ID: `G-XXXXXXXXXX` (from GA4)
   - **Send page view event when config loads: FALSE**
   - Trigger: All Pages
2. Custom Event trigger
   - Type: Custom Event
   - Event name: `tp_page_view`
3. GA4 Event tag – `page_view`
   - Type: GA4 Event
   - Uses GA4 Config tag above
   - Event name: `page_view`
   - Parameters from dataLayer variables: `page_location`, `page_path`, `page_title`

---

## 5. Other Events (Manual-Only)

### Authentication (Phase 2)

App:
- `analytics.login()` / `analytics.signUp()` / `analytics.clearUser()` push to `dataLayer`
- Event names: `login`, `sign_up`, `logout` (with `method`, `user_id`, etc.)

GTM (for each event):
- Data Layer Variable(s): `method`, `user_id` (as needed)
- Custom Event Trigger: event name `login` / `sign_up` / `logout`
- GA4 Event Tag with same event name; map parameters from dataLayer

### E‑commerce & Engagement (Phases 4–5)

Pattern is identical:
- App: `analytics.*` methods push descriptive events into `dataLayer`
- GTM: for each event type create DL variables → Custom Event trigger → GA4 Event tag
- No GA4 auto‑tracking (Enhanced Measurement) except optional base page views

---

## 6. GA4 & GTM Settings

### GA4 Enhanced Measurement

In GA4 Admin → Data Streams → Web:
- Turn **OFF**: scrolls, outbound clicks, site search, video engagement, file downloads, form interactions
- Page views may remain ON, but the GTM `page_view` tag above is the source of truth

### Environment & Secrets
- App repo stores only GTM ID
- GA4 Measurement ID lives in GTM only

---

## 7. Testing Checklist

### Phase 1
- GTM Preview connected; container loads on all pages
- `tp_page_view` appears once per navigation in the event stream
- GA4 `page_view` tag fires exactly once per navigation
- No duplicate `page_view` events in GA4 Realtime

### Phase 2+
- dataLayer event visible in GTM Preview when user acts
- GA4 Event tag fires only on intended trigger
- Event appears in GA4 Realtime with correct parameters

---

## 8. Phase-by-Phase Guide for Agent

This section explains what the agent should focus on in each phase: which parts
are **code changes in this repo** vs. **GTM/GA4 configuration** the agent
should guide the human through.

### Phase 1 – Foundation Setup (Status: 🟡 IN PROGRESS, 6/12)

**Objectives**
- Wire GA4 through GTM using the manual-events architecture
- Implement robust page view tracking using `tp_page_view`
- Validate data flow end‑to‑end: app → dataLayer → GTM → GA4

**Agent tasks (inside repo)**
- Ensure env vars:
  - `.env.local.example` / `.env.example` only expose `NEXT_PUBLIC_GTM_ID`
  - No GA4 Measurement ID in any env file.
- Verify analytics core:
  - `src/utils/analytics.ts` exists and:
    - Initializes `window.dataLayer` safely (SSR guards)
    - Implements `pageView()` pushing `event: 'tp_page_view'`
  - `src/hooks/usePageTracking.ts` calls `analytics.pageView()` on route changes.
- Verify integration:
  - `AnalyticsProvider` wraps the app in `app/layout.tsx`
  - GTM script and `<noscript>` iframe are present and use `NEXT_PUBLIC_GTM_ID`.
- (Optional) Add unit tests or lightweight checks for analytics util behavior.

**Partner tasks (GTM / GA4 UI – guide the human)**
- GA4:
  - Create GA4 property and obtain Measurement ID (`G-XXXXXXXXXX`).
  - Disable Enhanced Measurement toggles (except page views if desired).
- GTM:
  1. Create GA4 Configuration tag (All Pages, send_page_view = false).
  2. Create Custom Event trigger: `tp_page_view`.
  3. Create GA4 Event tag `page_view` mapping `page_location`, `page_path`, `page_title` from dataLayer variables.
  4. Create DL variables: `dlv - page_location`, `dlv - page_path`, `dlv - page_title`.
  5. Use GTM Preview to verify single `page_view` per navigation.

**Acceptance criteria**
- `tp_page_view` fired once per navigation in GTM Preview.
- GA4 `page_view` event visible in Realtime with correct URL/title.
- No duplicate page views per navigation.

---

### Phase 2 – Authentication Events

**Objectives**
- Track logins, sign‑ups, and logouts with method and user context.
- Lay groundwork for user‑level analytics in later phases.

**Agent tasks (inside repo)**
- Extend `analytics` utility with methods such as:
  - `login({ method, user_id })`
  - `signUp({ method, user_id })`
  - `logout()` or `clearUser()`
  - `setUser({ user_id, ...props })` for user properties (used in later phases).
- Each method should:
  - Push a dataLayer event (`login`, `sign_up`, `logout`) with relevant params.
  - Use SSR guards and avoid direct GA4 calls.
- Integrate analytics calls into auth flows:
  - On successful login (email / OAuth) → call `analytics.login`.
  - On successful sign‑up → call `analytics.signUp`.
  - On logout → call `analytics.logout` / `analytics.clearUser`.

**Partner tasks (GTM / GA4 UI – guide the human)**
- Create DL variables for auth params: e.g. `dlv - method`, `dlv - user_id`.
- Create Custom Event triggers for `login`, `sign_up`, `logout`.
- Create GA4 Event tags:
  - `login`, `sign_up`, `logout` mapping method/user_id.
- Optionally wire `user_id` / user properties via GA4 user properties.

**Acceptance criteria**
- GTM Preview shows `login` / `sign_up` / `logout` events with correct params.
- GA4 Realtime shows these events with expected method and user_id.

---

### Phase 3 – SSR‑Enhanced Page Tracking

**Objectives**
- Enrich `pageView` with SSR metadata (content type, IDs, etc.).
- Align analytics with SEO metadata and internal content model.

**Agent tasks (inside repo)**
- Introduce a pattern to pass server‑side metadata into page tracking, e.g.:
  - A `useAnalytics()` hook that accepts SSR props, or
  - Directly calling `analytics.pageView({ content_type, content_id, ... })`
    from pages like `app/events/[id]/page.tsx`, `app/communities/[id]/page.tsx`.
- Ensure `analytics.pageView` supports optional `content_type` and `content_id`.
- Document how new pages should supply their metadata.

**Partner tasks (GTM / GA4 UI – guide the human)**
- In GTM:
  - Add DL variables for `content_type`, `content_id`.
  - Pass them as GA4 event parameters on `page_view`.
- In GA4:
  - Create custom dimensions for content_type and content_id.

**Acceptance criteria**
- GA4 page_view events include content_type and content_id.
- Values match the app’s internal content model for key pages.

---

### Phase 4 – E‑commerce Tracking

**Objectives**
- Track the event registration funnel and revenue.
- Capture key e‑commerce events: view_item, begin_checkout, purchase, refund.

**Agent tasks (inside repo)**
- Extend `analytics` utility with methods such as:
  - `viewItem({ item_id, item_name, price, ... })`
  - `beginCheckout({ items, value, coupon, ... })`
  - `purchase({ transaction_id, value, currency, items, ... })`
  - `refund({ transaction_id, value, reason, ... })`
- Integrate at key points:
  - Event detail page load → `viewItem`.
  - Payment initiation (e.g. Razorpay button) → `beginCheckout`.
  - Successful payment callback → `purchase`.
  - Cancellation/rollback flow → `refund`.
- Ensure consistent transaction_id across flows (matches payment provider).

**Partner tasks (GTM / GA4 UI – guide the human)**
- Model events in GA4 as e‑commerce events or custom events.
- Create GTM tags/triggers mirroring `view_item`, `begin_checkout`, `purchase`, `refund`.
- Map dataLayer values into GA4’s e‑commerce schema.

**Acceptance criteria**
- End‑to‑end test run shows a complete funnel in GA4 (from view_item to purchase).
- Revenue and transaction IDs in GA4 match payment provider data.

---

### Phase 5 – Community & Discussion Engagement

**Objectives**
- Track community joins/leaves, discussion creation, comments, and moderation.
- Align GA4 engagement metrics with Supabase activity logs (dual tracking).

**Agent tasks (inside repo)**
- Add analytics methods like:
  - `joinCommunity({ community_id, name })`
  - `leaveCommunity({ community_id, name })`
  - `viewCommunity({ community_id, name })`
  - `createDiscussion({ discussion_id, community_id })`
  - `createComment({ comment_id, discussion_id })`
  - `flagContent({ content_type, content_id, reason })`
- Call these methods at the appropriate UI interaction points.
- Optionally coordinate with `useActivityLogger` for dual‑write patterns.

**Partner tasks (GTM / GA4 UI – guide the human)**
- Create Custom Event triggers and GA4 Event tags for the above events.
- Map GA4 parameters to match reporting needs (e.g. community_id, discussion_id).

**Acceptance criteria**
- Sample user flows (join, post, comment, flag) appear correctly in GA4.
- Events align with the Supabase activity log for the same actions.

---

### Phases 6–8 – Configuration‑Heavy Work

Later phases are more configuration/reporting driven. The agent’s role is to
keep code consistent and guide configuration.

**Phase 6 – Custom Dimensions & User Properties**
- Ensure all important fields are present in dataLayer payloads.
- Help define a stable schema for GA4 custom dimensions/user properties.
- Guide the human to:
  - Create matching custom dimensions in GA4.
  - Wire them in GTM tags.

**Phase 7 – Privacy & Consent**
- Introduce a consent state (e.g. in a store or context) that gates analytics.
- Make all analytics calls respect consent (no dataLayer push when disallowed).
- Guide configuration of Consent Mode or tag‑level consent in GTM.

**Phase 8 – Advanced Analytics**
- Help design audiences, funnels, and (optionally) BigQuery export schemas.
- Ensure event naming and parameters are stable enough for long‑term reporting.

---

## 9. Detailed Task Checklist

This checklist gives each phase concrete, numbered tasks the agent can update
and refer to (T1.x, T2.x, etc.). Status values here should stay in sync with
the summary table in **3. Current Status**.

### Phase 1 – Foundation Setup (T1.x)

- [x] **T1.1** Create GTM account & container (15 min)
  - Status: ✅ Complete
  - Output: `GTM-ND6D4RDP`

- [ ] **T1.2** Create GA4 property (15 min)
  - Status: Not started
  - Output: GA4 Measurement ID `G-XXXXXXXXXX` (used only in GTM)

- [x] **T1.3** Add environment variables (5 min)
  - Status: ✅ Complete
  - Files: `.env.local.example`, `.env.example`
  - Notes: Only `NEXT_PUBLIC_GTM_ID` is defined; no GA4 ID in env.

- [x] **T1.4** Install GTM script in `app/layout.tsx` (20 min)
  - Status: ✅ Complete
  - Files: `app/layout.tsx`, `src/components/analytics/GoogleTagManager.tsx`

- [x] **T1.5** Create `src/utils/analytics.ts` (30 min)
  - Status: ✅ Complete
  - Notes: Uses `window.dataLayer.push()` only; `pageView()` emits `tp_page_view`.

- [x] **T1.6** Create `src/hooks/usePageTracking.ts` (20 min)
  - Status: ✅ Complete
  - Notes: Calls `analytics.pageView()` on route changes.

- [x] **T1.7** Integrate page tracking in layout (10 min)
  - Status: ✅ Complete
  - Files: `app/layout.tsx`, `src/components/analytics/AnalyticsProvider.tsx`

- [ ] **T1.8** Configure GA4 tag in GTM (20 min)
  - Status: Not started
  - GTM tasks:
    - GA4 Config tag (All Pages, send_page_view = false)
    - Custom Event trigger `tp_page_view`
    - GA4 Event tag `page_view` using dataLayer params

- [ ] **T1.9** Create data layer variables in GTM (15 min)
  - Status: Not started
  - Variables: `dlv - page_location`, `dlv - page_path`, `dlv - page_title`

- [ ] **T1.10** Test in GTM Preview mode (30 min)
  - Status: Not started
  - Goal: Confirm single `tp_page_view` and single GA4 `page_view` per navigation.

- [ ] **T1.11** Publish GTM container (5 min)
  - Status: Not started
  - Notes: After Preview tests pass, publish version "Initial analytics setup".

- [ ] **T1.12** Verify in GA4 Realtime (15 min)
  - Status: Not started
  - Goal: See page_view events with correct URL/title and no duplicates.

---

### Phase 2 – Authentication Events (T2.x)

- [ ] **T2.1** Extend analytics utility with auth methods (30 min)
  - `login({ method, user_id })`, `signUp({ method, user_id })`,
    `logout()` / `clearUser()`, `setUser({ user_id, ...props })`.

- [ ] **T2.2** Push dataLayer events from auth methods (20 min)
  - Ensure events are named `login`, `sign_up`, `logout` with `method`, `user_id`.

- [ ] **T2.3** Integrate analytics calls into auth flows (30–40 min)
  - Wire into email + OAuth login, signup, and logout handlers.

- [ ] **T2.4** Create GTM data layer variables for auth (15 min)
  - Variables: `dlv - method`, `dlv - user_id` (and others as needed).

- [ ] **T2.5** Create GTM triggers for auth events (15 min)
  - Custom Event triggers: `login`, `sign_up`, `logout`.

- [ ] **T2.6** Create GA4 Event tags for auth events (20 min)
  - Tags: `login`, `sign_up`, `logout` using GA4 Config tag.

- [ ] **T2.7** Test auth flows in GTM Preview (30 min)
  - Verify correct parameters and no duplicate events.

- [ ] **T2.8** Verify auth events in GA4 Realtime (15 min)
  - Confirm `login` / `sign_up` / `logout` with method and user_id.

---

### Phase 3 – SSR‑Enhanced Page Tracking (T3.x)

- [ ] **T3.1** Define SSR analytics pattern (30 min)
  - Choose approach (e.g. `useAnalytics()` hook or direct calls with SSR props).

- [ ] **T3.2** Enrich pageView payloads (30–45 min)
  - Add `content_type`, `content_id`, and other SSR metadata into `pageView`.

- [ ] **T3.3** Integrate on key pages (45–60 min)
  - Events, communities, discussions detail pages.

- [ ] **T3.4** Add GTM variables & mappings (20 min)
  - DL variables + GA4 params for `content_type`, `content_id`.

- [ ] **T3.5** Create GA4 custom dimensions (15 min)
  - Dimensions for `content_type` and `content_id`.

- [ ] **T3.6** Test metadata accuracy (30 min)
  - Confirm GA4 shows correct values for sample pages.

---

### Phase 4 – E‑commerce Tracking (T4.x)

- [ ] **T4.1** Add e‑commerce methods to analytics utility (45 min)
  - `viewItem`, `beginCheckout`, `purchase`, `refund`.

- [ ] **T4.2** Wire e‑commerce calls into UI (45–60 min)
  - Event detail, payment initiation, success, and refund flows.

- [ ] **T4.3** Define transaction_id strategy (20 min)
  - Ensure IDs match Razorpay / backend records.

- [ ] **T4.4** Configure GTM e‑commerce tags (45 min)
  - GA4 events or GA4 e‑commerce schema for view_item, begin_checkout, purchase, refund.

- [ ] **T4.5** End‑to‑end funnel test (45 min)
  - Confirm funnel and revenue in GA4 match test payments.

---

### Phase 5 – Community & Discussion Events (T5.x)

- [ ] **T5.1** Implement community/discussion methods in analytics (45 min)
  - join/leave/view community, create discussion, create comment, flag content.

- [ ] **T5.2** Integrate methods at interaction points (45–60 min)
  - Buttons and actions in community/discussion UIs.

- [ ] **T5.3** Configure GTM tags/triggers (45 min)
  - Custom Event triggers and GA4 tags for each engagement event.

- [ ] **T5.4** Align with Supabase activity log (30 min)
  - Spot‑check that GA4 events match Supabase audit entries.

---

### Phases 6–8 (T6.x, T7.x, T8.x)

High‑level tasks only; fill in details when these phases begin.

- [ ] **T6.x** Define and wire custom dimensions & user properties
- [ ] **T7.x** Implement consent gating and GTM Consent Mode
- [ ] **T8.x** Set up advanced reports, audiences, and optional BigQuery export
