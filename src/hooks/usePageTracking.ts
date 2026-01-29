'use client';

/**
 * Page Tracking Hook
 *
 * Automatically tracks page views on route changes in Next.js App Router.
 * Uses the analytics utility to push events to GTM dataLayer.
 *
 * @see docs/GA4_GTM_IMPLEMENTATION_PLAN.md for full implementation details
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/utils/analytics';

interface PageTrackingOptions {
  /** Additional parameters to include with page view events */
  additionalParams?: Record<string, unknown>;
  /** Whether to track the initial page load (default: true) */
  trackInitialLoad?: boolean;
}

/**
 * Hook to automatically track page views on route changes
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Basic usage
 * usePageTracking();
 *
 * // With additional parameters
 * usePageTracking({
 *   additionalParams: { content_type: 'event', content_id: eventId }
 * });
 * ```
 */
export function usePageTracking(options: PageTrackingOptions = {}): void {
  const { additionalParams, trackInitialLoad = true } = options;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Skip initial load if configured
    if (isInitialLoad.current && !trackInitialLoad) {
      isInitialLoad.current = false;
      return;
    }

    // Build full URL with search params
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Track page view
    analytics.pageView({
      page_path: pathname,
      page_location: typeof window !== 'undefined' ? window.location.href : url,
      page_title: typeof document !== 'undefined' ? document.title : '',
      ...additionalParams,
    });

    isInitialLoad.current = false;
  }, [pathname, searchParams, additionalParams, trackInitialLoad]);
}

export default usePageTracking;

