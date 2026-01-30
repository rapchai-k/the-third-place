'use client';

import { Suspense } from 'react';
import { AuthPage } from '@/views/Auth';
import { Skeleton } from '@/components/ui/skeleton';

// Force dynamic rendering for auth page
export const dynamic = 'force-dynamic';

function AuthPageContent() {
  return <AuthPage />;
}

export default function AuthPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md space-y-4 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
