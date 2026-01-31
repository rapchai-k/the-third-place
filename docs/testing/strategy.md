## 🧪 Testing Plan: The Third Place

This document outlines the testing strategy, frameworks, and expected test scenarios for "The Third Place" web app.

---

## ✅ Overview

The testing plan ensures that:

* Functional requirements are met
* Business logic is enforced correctly
* APIs and RLS policies behave securely
* UX flows are intuitive, fail-safe, and accessible
* Agents validate core journeys in real-world usage scenarios

---

## 🔧 Tools & Frameworks

| Layer      | Stack                                   |
| ---------- | --------------------------------------- |
| Unit Tests | Vitest, React Testing Library           |
| API Tests  | Jest, Supabase Deno Tests               |
| E2E Tests  | Playwright (preferred) or Cypress       |
| CI         | GitHub Actions + Vercel Preview Deploys |

---

## 🔁 Test Types

### 1. Unit Tests

* Component logic (e.g., Button states, form validation)
* Zod schema validations
* Toast notifications

### 2. API + Backend Tests

* REST endpoints (success + failure cases)
* Auth and RLS protection (based on roles)
* Payment webhook handling
* Thread expiry job triggers
* Activity log creation

### 3. Frontend UI Tests

* Component rendering with props (CircularGallery, TiltedCard)
* Conditional visibility (admin features, registration state)
* Error state visuals (e.g., RetryButton, EmptyState)

### 4. E2E Flows (via Playwright)

**Core paths:**

* Sign in via Google → Join Community → Register for Event
* Event registration → Payment → Confirmation → Cancel
* Admin creates event, discussion → User replies → Thread auto closes
* Flagging users → Admin sees override history

### 5. Agent-Based Tests

AI agents will:

* Mimic user actions using seeded data
* Simulate edge cases (expired thread, duplicate payments, unauthorized access)
* Confirm backend activity logs are written
* Check UI state sync with API
* Record issues for correction

---

## 🧱 CI Integration

* GitHub Actions setup will:

  * Lint and typecheck code
  * Run all tests on pull request
  * Trigger Playwright suite on staging deploy
  * Block merge on failed critical tests

---

## 🧩 Coverage Expectations

| Area                 | Min Coverage     |
| -------------------- | ---------------- |
| Components           | 90%              |
| API Handlers         | 95%              |
| RLS Logic            | 100%             |
| E2E Critical Paths   | All flows        |
| Agent-verified flows | Top 10 use cases |

---

## 🗂️ Suggested File Structure

```bash
/tests
  /unit
    Button.test.tsx
    CommunityCard.test.tsx
  /api
    registerEvent.test.ts
    postDiscussion.test.ts
  /e2e
    user-journey.spec.ts
    admin-controls.spec.ts
/playwright.config.ts
/.github/workflows/test.yml
```