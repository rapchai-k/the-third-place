'use client';

import CommunityDetail from '@/views/CommunityDetail';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSuspenseWrapper } from '@/components/layout/PageSuspenseWrapper';

function CommunityDetailContent() {
  return (
    <AppLayout>
      <CommunityDetail />
    </AppLayout>
  );
}

export default function CommunityDetailPage() {
  return (
    <PageSuspenseWrapper>
      <CommunityDetailContent />
    </PageSuspenseWrapper>
  );
}
