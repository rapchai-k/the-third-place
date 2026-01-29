import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCommunityById } from '@/lib/supabase/server';
import CommunityDetailClient from '@/views/CommunityDetailClient';
import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper';

interface CommunityDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Generate dynamic metadata for the community detail page.
 * This enables SEO with proper title, description, and Open Graph tags.
 */
export async function generateMetadata({ params }: CommunityDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const community = await getCommunityById(id);

  if (!community) {
    return {
      title: 'Community Not Found | My Third Place',
      description: 'The community you are looking for could not be found.',
    };
  }

  const memberCount = community.member_count || 0;

  return {
    title: `${community.name} | My Third Place`,
    description: community.description || `Join ${community.name} community in ${community.city} with ${memberCount} members.`,
    alternates: {
      canonical: `/communities/${id}`,
    },
    openGraph: {
      title: `${community.name} | My Third Place`,
      description: community.description || `Join ${community.name} community in ${community.city}.`,
      type: 'website',
      images: community.image_url ? [{ url: community.image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${community.name} | My Third Place`,
      description: community.description || `Join ${community.name} community in ${community.city}.`,
      images: community.image_url ? [community.image_url] : [],
    },
  };
}

/**
 * Server Component for the community detail page.
 * Fetches community data server-side for SSR and SEO.
 */
export default async function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  const { id } = await params;
  const community = await getCommunityById(id);

  if (!community) {
    notFound();
  }

  return (
    <AppLayoutWrapper>
      <CommunityDetailClient initialCommunity={community} />
    </AppLayoutWrapper>
  );
}
