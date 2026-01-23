import type { Metadata } from 'next';
import { getDiscussions } from '@/lib/supabase/server';
import DiscussionsClient from '@/views/Discussions';
import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper';

/**
 * Static metadata for the discussions listing page.
 */
export const metadata: Metadata = {
  title: 'Discussions | My Third Place',
  description: 'Join community discussions, share your thoughts, and connect with others. Explore topics and conversations happening in your communities.',
  openGraph: {
    title: 'Discussions | My Third Place',
    description: 'Join community discussions and share your thoughts.',
    type: 'website',
    siteName: 'My Third Place',
  },
  twitter: {
    card: 'summary',
    title: 'Discussions | My Third Place',
    description: 'Join community discussions and share your thoughts.',
  },
};

/**
 * Server Component - fetches initial discussions data on the server.
 * Client Component handles filters, search, and user interactions.
 */
export default async function DiscussionsPage() {
  const discussions = await getDiscussions({ limit: 20 });

  return (
    <AppLayoutWrapper>
      <DiscussionsClient initialDiscussions={discussions} />
    </AppLayoutWrapper>
  );
}
