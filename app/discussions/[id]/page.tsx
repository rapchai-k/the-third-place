'use client';

import DiscussionDetail from '@/views/DiscussionDetail';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSuspenseWrapper } from '@/components/layout/PageSuspenseWrapper';

function DiscussionDetailContent() {
  return (
    <AppLayout>
      <DiscussionDetail />
    </AppLayout>
  );
}

export default function DiscussionDetailPage() {
  return (
    <PageSuspenseWrapper>
      <DiscussionDetailContent />
    </PageSuspenseWrapper>
  );
}
