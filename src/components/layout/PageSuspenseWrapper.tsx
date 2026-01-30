'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface PageSuspenseWrapperProps {
  children: React.ReactNode;
}

/**
 * Default loading fallback for pages.
 * Shows a skeleton layout matching the AppLayout structure.
 */
function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="h-16 border-b bg-background">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper component that provides Suspense boundary for pages using useSearchParams.
 * This is required for Next.js static generation with client components that use
 * hooks like useSearchParams.
 */
export function PageSuspenseWrapper({ children }: PageSuspenseWrapperProps) {
  return <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>;
}

