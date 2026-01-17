'use client';

import Dashboard from '@/views/Dashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSuspenseWrapper } from '@/components/layout/PageSuspenseWrapper';

function DashboardContent() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}

export default function DashboardPage() {
  return (
    <PageSuspenseWrapper>
      <DashboardContent />
    </PageSuspenseWrapper>
  );
}
