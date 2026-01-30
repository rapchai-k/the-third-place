'use client';

import { Suspense } from 'react';
import { AuthCallback } from '@/views/AuthCallback';

// Force dynamic rendering - this page handles OAuth callbacks
export const dynamic = 'force-dynamic';

function AuthCallbackContent() {
  return <AuthCallback />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
