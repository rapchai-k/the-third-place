'use client';

import { PaymentSuccess } from '@/views/PaymentSuccess';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageSuspenseWrapper } from '@/components/layout/PageSuspenseWrapper';

// Force dynamic rendering - this page reads query params for payment verification
export const dynamic = 'force-dynamic';

function PaymentSuccessContent() {
  return (
    <AppLayout>
      <PaymentSuccess />
    </AppLayout>
  );
}

export default function PaymentSuccessPage() {
  return (
    <PageSuspenseWrapper>
      <PaymentSuccessContent />
    </PageSuspenseWrapper>
  );
}
