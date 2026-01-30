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
 * Uses SEO override fields when available, falling back to base content fields.
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

  // SEO fields with fallbacks - use custom SEO values if set, otherwise derive from content
  const seoTitle =
    discussion.seo_title || `${discussion.title} | ${communityName} | My Third Place`;
  const seoDescription =
    discussion.seo_description ||
    discussion.prompt ||
    `Join the discussion "${discussion.title}" in ${communityName} with ${commentCount} comments.`;
  const seoImage = discussion.seo_image_url || '/logo.png';
  const seoKeywords =
    discussion.seo_keywords && discussion.seo_keywords.length > 0
      ? discussion.seo_keywords
      : [discussion.title, communityName, 'discussion', 'community', 'My Third Place'].filter(
          Boolean
        );

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    alternates: {
      canonical: `/discussions/${id}`,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: 'article',
      publishedTime: discussion.created_at,
      modifiedTime: discussion.updated_at,
      authors: discussion.users?.name ? [discussion.users.name] : [],
      images: seoImage
        ? [
            {
              url: seoImage,
              width: 1200,
              height: 630,
              alt: discussion.title,
            },
          ]
        : ['/logo.png'],
      siteName: 'My Third Place',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: seoImage ? [seoImage] : ['/logo.png'],
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
