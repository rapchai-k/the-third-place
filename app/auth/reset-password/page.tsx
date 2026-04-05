'use client';

import { Suspense } from 'react';
import { ResetPassword } from '@/views/ResetPassword';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
