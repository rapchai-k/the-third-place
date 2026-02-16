import type { MetadataRoute } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://mythirdplace.rapchai.com';

/**
 * Next.js dynamic sitemap generator.
 *
 * - Static routes are listed explicitly.
 * - Dynamic routes (communities, events, discussions) are fetched from
 *   Supabase at request time so the sitemap is always up-to-date.
 *
 * Next.js serves this at /sitemap.xml automatically.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static routes ────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/communities`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/discussions`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/auth`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // ── Dynamic routes from Supabase ────────────────────────────────────
  let communityRoutes: MetadataRoute.Sitemap = [];
  let eventRoutes: MetadataRoute.Sitemap = [];
  let discussionRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = await createServerSupabaseClient();

    // Fetch all community IDs + updated_at
    const { data: communities } = await supabase
      .from('communities')
      .select('id, updated_at');

    if (communities) {
      communityRoutes = communities.map((c) => ({
        url: `${SITE_URL}/communities/${c.id}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }

    // Fetch all active event IDs + updated_at
    const { data: events } = await supabase
      .from('events')
      .select('id, updated_at')
      .eq('is_cancelled', false);

    if (events) {
      eventRoutes = events.map((e) => ({
        url: `${SITE_URL}/events/${e.id}`,
        lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }

    // Fetch all visible discussion IDs + updated_at
    const { data: discussions } = await supabase
      .from('discussions')
      .select('id, updated_at')
      .eq('is_visible', true);

    if (discussions) {
      discussionRoutes = discussions.map((d) => ({
        url: `${SITE_URL}/discussions/${d.id}`,
        lastModified: d.updated_at ? new Date(d.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    // If Supabase is unreachable, return only static routes
    console.error('Sitemap: failed to fetch dynamic routes', error);
  }

  return [
    ...staticRoutes,
    ...communityRoutes,
    ...eventRoutes,
    ...discussionRoutes,
  ];
}

