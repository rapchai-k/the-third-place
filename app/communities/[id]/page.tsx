import { redirect, notFound } from 'next/navigation';
import { getCommunityById } from '@/lib/supabase/server';

interface CommunityDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Legacy community URL handler.
 * Redirects /communities/:id → /c/:slug (canonical URL).
 * Keeps old bookmarks and shared links working.
 */
export default async function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  const { id } = await params;
  const community = await getCommunityById(id);

  if (!community) {
    notFound();
  }

  if (community.slug) {
    redirect(`/c/${community.slug}`);
  }

  // Fallback: if no slug exists, return 404
  // (all communities should have slugs in production)
  notFound();
}
