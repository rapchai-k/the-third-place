'use client';

import Index from '@/views/Index';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSuspenseWrapper } from '@/components/layout/PageSuspenseWrapper';

function HomeContent() {
  return (
    <AppLayout>
      <Index />
    </AppLayout>
  );
}

export default function HomePage() {
  return (
    <PageSuspenseWrapper>
      <HomeContent />
    </PageSuspenseWrapper>
  );
}
