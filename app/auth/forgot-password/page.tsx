'use client';

import { Suspense } from 'react';
import { ForgotPassword } from '@/views/ForgotPassword';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPassword />
    </Suspense>
  );
}
