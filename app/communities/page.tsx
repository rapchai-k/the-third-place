'use client';

import Communities from '@/views/Communities';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSuspenseWrapper } from '@/components/layout/PageSuspenseWrapper';

function CommunitiesContent() {
  return (
    <AppLayout>
      <Communities />
    </AppLayout>
  );
}

export default function CommunitiesPage() {
  return (
    <PageSuspenseWrapper>
      <CommunitiesContent />
    </PageSuspenseWrapper>
  );
}
