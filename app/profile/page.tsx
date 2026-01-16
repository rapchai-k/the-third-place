'use client';

import { ProfilePage as Profile } from '@/views/Profile';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ProfilePageWrapper() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Profile />
      </AppLayout>
    </ProtectedRoute>
  );
}

