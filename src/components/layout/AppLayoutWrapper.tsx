'use client';

import { Suspense } from 'react';
import { AppLayout } from './AppLayout';

/**
 * Loading fallback for the AppLayout during Suspense.
 * Provides a minimal skeleton to prevent layout shift.
 */
function AppLayoutFallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col w-full">
      {/* Minimal header placeholder */}
      <div className="bg-background">
        <div className="flex items-center justify-center h-16 px-4">
          <div className="animate-pulse bg-muted rounded h-8 w-32" />
        </div>
      </div>
      {/* Page content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

/**
 * Client-side wrapper for AppLayout.
 * Used in Server Components that need the interactive AppLayout.
 *
 * This exists because AppLayout uses client-side hooks (useAuth, useLocation, etc.)
 * and cannot be directly used in Server Components.
 *
 * IMPORTANT: Wrapped in Suspense because AppLayout uses useSearchParams() via
 * the nextRouterAdapter's useLocation() hook. In Next.js App Router, useSearchParams()
 * must be wrapped in a Suspense boundary when used in client components that are
 * part of SSR pages, otherwise it causes hydration issues.
 */
export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppLayoutFallback>{children}</AppLayoutFallback>}>
      <AppLayout>{children}</AppLayout>
    </Suspense>
  );
}

