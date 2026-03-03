# Testing Map

## Frameworks and Runtime
- Primary test runner is Vitest (`package.json` scripts `test`, `test:watch`, `test:coverage`, `test:ci`).
- DOM/component tests use React Testing Library + `@testing-library/jest-dom` (`src/test/setup.ts`, `src/components/ui/__tests__/Button.test.tsx`).
- Test environment is `jsdom` with global APIs/mocks configured in `vitest.config.ts` and `src/test/setup.ts`.
- E2E is planned via Playwright scripts (`package.json` has `test:e2e`), but no `playwright.config.*` is currently present in repo root.

## Test Configuration
- Global setup file: `src/test/setup.ts`.
- Include globs: `src/**/*.{test,spec}.*` and `src/test/**/*.test.*` in `vitest.config.ts`.
- Excludes include `src/test/e2e/**`, fixtures, and test utility folders (`vitest.config.ts`).
- Coverage uses V8 provider with global thresholds (branches 80, functions 85, lines/statements 85) and stricter folder thresholds for `src/contexts/**`, `src/hooks/**`, and `src/lib/**` (`vitest.config.ts`).

## Test Organization Patterns
- Colocated unit/component tests under `__tests__` near source (`src/components/__tests__/ProtectedRoute.test.tsx`, `src/hooks/__tests__/useWelcomeEmail.test.tsx`, `src/contexts/__tests__/ThemeProvider.test.tsx`).
- Centralized test suites by intent under `src/test/`:
  - Component-level suites (`src/test/components/reactbits.test.tsx`)
  - Integration-style suites (`src/test/integration/*.test.ts`)
  - Database/RLS behavior suites (`src/test/database/constraints.test.ts`, `src/test/rls/user-data-isolation.test.ts`)
- Shared helpers/factories live in `src/test/utils/test-utils.tsx` and `src/test/utils/mock-factories.ts`.

## Common Testing Techniques
- Extensive Supabase mocking with chainable query-builder doubles (`src/test/setup.ts`, `src/test/integration/auth.integration.test.ts`).
- Provider-aware rendering via `renderWithProviders` wrapper to include Auth, Theme, Tooltip, and QueryClient context (`src/test/utils/test-utils.tsx`).
- Async UI assertions use `findBy...`/`waitFor` patterns (`src/components/__tests__/ProtectedRoute.test.tsx`).
- Security/data integrity scenarios are asserted using Postgres-style error codes in mocked responses (`src/test/database/constraints.test.ts`, `src/test/rls/community-access.test.ts`).

## Execution Workflow
- Fast local loop: `npm test` or `npm run test:watch` (`package.json`).
- Coverage: `npm run test:coverage` and CI JUnit report path `test-results/junit.xml` (`package.json`, `vitest.config.ts`).
- End-to-end pre-commit script patterns exist in both `src/scripts/test.js` and `src/test/run-tests.js` (typecheck + lint + tests, with one script also running build).

## Current Gaps and Risks
- "Integration" and "database/RLS" suites are mostly mock-based and do not run against a real Supabase/Postgres instance (`src/test/integration/auth.integration.test.ts`, `src/test/database/constraints.test.ts`, `src/test/rls/user-data-isolation.test.ts`).
- Several broad `@ts-nocheck` usage in tests reduces type-safety guarantees (`src/test/integration/auth.integration.test.ts`, `src/test/rls/user-data-isolation.test.ts`).
- E2E commands exist but repository lacks visible Playwright configuration/spec files, suggesting E2E layer is incomplete in current state.
