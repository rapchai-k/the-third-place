'use client';

import Discussions from '@/views/Discussions';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSuspenseWrapper } from '@/components/layout/PageSuspenseWrapper';

function DiscussionsContent() {
  return (
    <AppLayout>
      <Discussions />
    </AppLayout>
  );
}

export default function DiscussionsPage() {
  return (
    <PageSuspenseWrapper>
      <DiscussionsContent />
    </PageSuspenseWrapper>
  );
}
