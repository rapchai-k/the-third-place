'use client';

import { ReferralCenter } from '@/views/ReferralCenter';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ReferralsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ReferralCenter />
      </AppLayout>
    </ProtectedRoute>
  );
}

