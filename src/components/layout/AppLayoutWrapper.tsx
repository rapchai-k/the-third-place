'use client';

import { AppLayout } from './AppLayout';

/**
 * Client-side wrapper for AppLayout.
 * Used in Server Components that need the interactive AppLayout.
 * 
 * This exists because AppLayout uses client-side hooks (useAuth, useLocation, etc.)
 * and cannot be directly used in Server Components.
 */
export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

