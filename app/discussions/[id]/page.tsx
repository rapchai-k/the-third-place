import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDiscussionById } from '@/lib/supabase/server';
import DiscussionDetailClient from '@/views/DiscussionDetailClient';
import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper';

interface DiscussionDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Generate dynamic metadata for the discussion detail page.
 * This enables SEO with proper title, description, and Open Graph tags.
 */
export async function generateMetadata({ params }: DiscussionDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const discussion = await getDiscussionById(id);

  if (!discussion) {
    return {
      title: 'Discussion Not Found | My Third Place',
      description: 'The discussion you are looking for could not be found.',
    };
  }

  const communityName = discussion.communities?.name || 'Community';
  const commentCount = discussion.discussion_comments?.[0]?.count || 0;

  return {
    title: `${discussion.title} | ${communityName} | My Third Place`,
    description: discussion.prompt || `Join the discussion "${discussion.title}" in ${communityName} with ${commentCount} comments.`,
    alternates: {
      canonical: `/discussions/${id}`,
    },
    openGraph: {
      title: `${discussion.title} | My Third Place`,
      description: discussion.prompt || `Join the discussion in ${communityName}.`,
      type: 'article',
      publishedTime: discussion.created_at,
      modifiedTime: discussion.updated_at,
      authors: discussion.users?.name ? [discussion.users.name] : [],
    },
    twitter: {
      card: 'summary',
      title: `${discussion.title} | My Third Place`,
      description: discussion.prompt || `Join the discussion in ${communityName}.`,
    },
  };
}

/**
 * Server Component for the discussion detail page.
 * Fetches discussion data server-side for SSR and SEO.
 */
export default async function DiscussionDetailPage({ params }: DiscussionDetailPageProps) {
  const { id } = await params;
  const discussion = await getDiscussionById(id);

  if (!discussion) {
    notFound();
  }

  return (
    <AppLayoutWrapper>
      <DiscussionDetailClient initialDiscussion={discussion} />
    </AppLayoutWrapper>
  );
}
