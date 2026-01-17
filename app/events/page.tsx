'use client';

import Events from '@/views/Events';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSuspenseWrapper } from '@/components/layout/PageSuspenseWrapper';

function EventsContent() {
  return (
    <AppLayout>
      <Events />
    </AppLayout>
  );
}

export default function EventsPage() {
  return (
    <PageSuspenseWrapper>
      <EventsContent />
    </PageSuspenseWrapper>
  );
}
