import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCommunityBySlug } from '@/lib/supabase/server';
import CommunityDetailClient from '@/views/CommunityDetailClient';
import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper';

interface CommunitySlugPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate dynamic metadata for the community detail page.
 * This enables SEO with proper title, description, and Open Graph tags.
 * Uses SEO override fields when available, falling back to base content fields.
 */
export async function generateMetadata({ params }: CommunitySlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);

  if (!community) {
    return {
      title: 'Community Not Found | My Third Place',
      description: 'The community you are looking for could not be found.',
    };
  }

  const memberCount = community.member_count || 0;

  // SEO fields with fallbacks - use custom SEO values if set, otherwise derive from content
  const seoTitle = community.seo_title || `${community.name} | My Third Place`;
  const seoDescription =
    community.seo_description ||
    community.description ||
    `Join ${community.name} community in ${community.city} with ${memberCount} members.`;
  const seoImage = community.seo_image_url || community.image_url || '/logo.png';
  const seoKeywords =
    community.seo_keywords && community.seo_keywords.length > 0
      ? community.seo_keywords
      : [community.name, community.city, 'community', 'events', 'My Third Place'].filter(Boolean);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    alternates: {
      canonical: `/c/${slug}`,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: 'website',
      images: seoImage
        ? [
            {
              url: seoImage,
              width: 1200,
              height: 630,
              alt: community.name,
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
 * Server Component for the canonical community detail page.
 * Fetches community data server-side by slug for SSR and SEO.
 * This is the primary community URL: /c/:slug
 */
export default async function CommunitySlugPage({ params }: CommunitySlugPageProps) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);

  if (!community) {
    notFound();
  }

  return (
    <AppLayoutWrapper>
      <CommunityDetailClient initialCommunity={community} />
    </AppLayoutWrapper>
  );
}
