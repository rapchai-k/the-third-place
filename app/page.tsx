import type { Metadata } from 'next';
import { getHomePageData } from '@/lib/supabase/server';
import IndexClient from '@/views/Index';
import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper';

/**
 * Static metadata for the home page.
 */
export const metadata: Metadata = {
  title: 'My Third Place | Connect, Discover, Engage',
  description: 'Find your community and connect with like-minded people. Discover events, join discussions, and build meaningful relationships in your third place.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'My Third Place | Connect, Discover, Engage',
    description: 'Find your community and connect with like-minded people.',
    type: 'website',
    siteName: 'My Third Place',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Third Place | Connect, Discover, Engage',
    description: 'Find your community and connect with like-minded people.',
  },
};

/**
 * Server Component - fetches initial featured data on the server.
 * Client Component handles interactions, infinite scroll, and animations.
 */
export default async function HomePage() {
  const { communities, events } = await getHomePageData();

  return (
    <AppLayoutWrapper>
      <IndexClient initialCommunities={communities} initialEvents={events} />
    </AppLayoutWrapper>
  );
}
