'use client';

/**
 * Analytics Provider Component
 *
 * Wraps the application to provide automatic page tracking.
 * Uses Suspense boundary for useSearchParams() compatibility.
 *
 * @see docs/GA4_GTM_IMPLEMENTATION_PLAN.md for full implementation details
 */

import { Suspense } from 'react';
import { usePageTracking } from '@/hooks/usePageTracking';

/**
 * Inner component that uses the page tracking hook
 * Separated to allow Suspense boundary for useSearchParams()
 */
function PageTracker({ children }: { children: React.ReactNode }): JSX.Element {
  usePageTracking();
  return <>{children}</>;
}

/**
 * Analytics Provider
 *
 * Wraps children with automatic page view tracking.
 * Uses Suspense to handle useSearchParams() in SSR context.
 *
 * @example
 * ```tsx
 * <AnalyticsProvider>
 *   <App />
 * </AnalyticsProvider>
 * ```
 */
export function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <Suspense fallback={<>{children}</>}>
      <PageTracker>{children}</PageTracker>
    </Suspense>
  );
}

export default AnalyticsProvider;

