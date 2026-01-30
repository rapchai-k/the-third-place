import type { Metadata } from 'next';
import { getCommunities } from '@/lib/supabase/server';
import CommunitiesClient from '@/views/Communities';
import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper';

/**
 * Static metadata for the communities listing page.
 */
export const metadata: Metadata = {
  title: 'Communities | My Third Place',
  description: 'Discover and join communities near you. Connect with like-minded people, attend events, and build meaningful relationships.',
  openGraph: {
    title: 'Communities | My Third Place',
    description: 'Discover and join communities near you.',
    type: 'website',
    siteName: 'My Third Place',
  },
  twitter: {
    card: 'summary',
    title: 'Communities | My Third Place',
    description: 'Discover and join communities near you.',
  },
};

/**
 * Server Component - fetches initial communities data on the server.
 * Client Component handles filters, search, and user interactions.
 */
export default async function CommunitiesPage() {
  const communities = await getCommunities({ limit: 20 });

  return (
    <AppLayoutWrapper>
      <CommunitiesClient initialCommunities={communities} />
    </AppLayoutWrapper>
  );
}
