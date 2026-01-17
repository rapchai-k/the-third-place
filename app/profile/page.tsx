'use client';

import { ProfilePage as Profile } from '@/views/Profile';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSuspenseWrapper } from '@/components/layout/PageSuspenseWrapper';

function ProfileContent() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Profile />
      </AppLayout>
    </ProtectedRoute>
  );
}

export default function ProfilePageWrapper() {
  return (
    <PageSuspenseWrapper>
      <ProfileContent />
    </PageSuspenseWrapper>
  );
}
