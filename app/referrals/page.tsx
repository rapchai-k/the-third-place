'use client';

import { ReferralCenter } from '@/views/ReferralCenter';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSuspenseWrapper } from '@/components/layout/PageSuspenseWrapper';

function ReferralsContent() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ReferralCenter />
      </AppLayout>
    </ProtectedRoute>
  );
}

export default function ReferralsPage() {
  return (
    <PageSuspenseWrapper>
      <ReferralsContent />
    </PageSuspenseWrapper>
  );
}
