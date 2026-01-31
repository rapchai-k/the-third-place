## 🧠 Prompt: Build a community-powered event platform

This project defines a complete user journey, from discovering communities to attending events and participating in time-bound discussions. It includes:

* Community and event exploration
* User profiles and badges
* Participation tracking
* Admin controls
* Payment and referral systems
* Google OAuth-based login

All logic should be implemented using Supabase (Postgres, RLS, Auth, Storage) and a Next.js frontend using the ShadCN UI kit.

### 🧩 Reference Files

Refer to the following modular documents:

* `01-overview.md`: Domain structure, definitions, and key flows
* `01-rest-contracts.md`: REST API definitions
* `01-seed-data.json`: Sample records for bootstrapping
* `01-theme.css`: Color, radius, and font tokens
* `01-ui-spec.md`: Key UI layouts and page interactions
* `01-uml.puml`: Supabase schema as PlantUML
* `02-env.md`: Required ENV vars and secrets
* `02-error-envelope.md`: Consistent API error handling spec
* `02-shadcn-setup.md`: UI library integration checklist
* `02-ux-component-map.md`: Maps UI spec to frontend components
* `03-rls-policies.sql`: Row-level security rules
* `03-webhooks.md`: Payment callbacks, thread expiry, activity logging

---

## 🧪 Testing Requirements

> All generated features and endpoints should be accompanied by **automated test coverage** and **agent-led functionality tests** to validate business logic and user journey correctness.

### **Testing Philosophy**

Ensure that:

1. Each REST API follows the contracts defined in `01-rest-contracts.md`
2. All RLS policies are enforced as defined in `03-rls-policies.sql`
3. Frontend behavior mirrors the expected state flows and visual feedback
4. Errors are gracefully handled and displayed using patterns from `02-error-envelope.md`
5. Agent testers verify the end-to-end functionality of real user workflows

---

### **1. Backend Tests**

* **Stack**: Supabase Functions with Deno test or Jest
* **Tests**:

  * API inputs/outputs, success + error cases
  * Auth + RLS: insert/update/delete guarded by correct roles
  * Side-effects (email triggers, activity logs, thread expiry)

---

### **2. Frontend Tests**

* **Stack**: Vitest + React Testing Library
* **Tests**:

  * UI rendering (e.g., Circular Gallery, Tilted Cards)
  * Input validation (e.g., profile update, discussion post)
  * State transitions (e.g., registered → confirmed → cancelled)
  * Empty + failure states (e.g., no events, payment failure)

---

### **3. E2E Tests**

* **Stack**: Playwright or Cypress
* **Critical Workflows**:

  * User sign-in via Google OAuth
  * Join a community → View events
  * Register for an event → see payment success/failure flow
  * Post in a discussion → thread auto-closes
  * Admin actions: extend thread, cancel reservation, assign host

---

### **4. Agent-Led Functionality Testing**

Agents must:

* Simulate end-user journeys to validate business logic
* Test key flows:

  * Community discovery → Join → See new events
  * Profile update with image + interests
  * Discussion creation by admin → participation by member
  * Flagging + override process
* Ensure test data matches `01-seed-data.json`

Agents should **log edge cases** (e.g., viewing events without community join, host visibility, expired threads) and auto-correct where possible.

---

### **5. Automation & CI**

* GitHub Actions workflow for:

  * Linting
  * Type-checking
  * Unit + integration test runs
  * E2E smoke tests on deploy preview or staging
* All tests must pass before merging or releasing
