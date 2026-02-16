import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEventByShortCode } from '@/lib/supabase/server';
import EventDetailClient from '@/views/EventDetailClient';
import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper';
import { format } from 'date-fns';

type Props = {
  params: Promise<{ shortCode: string }>;
};

/**
 * Generate dynamic metadata for SEO and social sharing.
 * Canonical URL is /e/:shortCode.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shortCode } = await params;
  const event = await getEventByShortCode(shortCode);

  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The event you are looking for does not exist.',
    };
  }

  const eventDate = event.date_time
    ? format(new Date(event.date_time), 'EEEE, MMMM d, yyyy')
    : 'Date TBD';

  const eventTime = event.date_time
    ? format(new Date(event.date_time), 'h:mm a')
    : '';

  const price = event.price && event.price > 0 ? `₹${event.price}` : 'Free';

  const seoTitle = event.seo_title || event.title;
  const seoDescription =
    event.seo_description ||
    event.description?.slice(0, 160) ||
    `Join us for ${event.title} at ${event.venue}`;
  const seoImage = event.seo_image_url || event.image_url || '/logo.png';
  const seoKeywords =
    event.seo_keywords && event.seo_keywords.length > 0
      ? event.seo_keywords
      : [
        event.title,
        event.communities?.name || '',
        event.communities?.city || '',
        'event',
        'community event',
      ].filter(Boolean);

  return {
    title: seoTitle,
    description: `${seoDescription} | ${eventDate}${eventTime ? ` at ${eventTime}` : ''} | ${price}`,
    keywords: seoKeywords,
    alternates: {
      canonical: `/e/${shortCode}`,
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
            alt: seoTitle,
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
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        description: event.description,
        startDate: event.date_time,
        location: {
          '@type': 'Place',
          name: event.venue,
          address: {
            '@type': 'PostalAddress',
            addressLocality: event.communities?.city,
          },
        },
        image: seoImage,
        organizer: {
          '@type': 'Organization',
          name: event.communities?.name || 'My Third Place',
        },
        offers: {
          '@type': 'Offer',
          price: event.price || 0,
          priceCurrency: event.currency || 'INR',
          availability:
            (event.event_registrations?.[0]?.count || 0) < event.capacity
              ? 'https://schema.org/InStock'
              : 'https://schema.org/SoldOut',
        },
        eventStatus: event.is_cancelled
          ? 'https://schema.org/EventCancelled'
          : 'https://schema.org/EventScheduled',
      }),
    },
  };
}

/**
 * Canonical event page at /e/:shortCode.
 * Server Component — fetches event data on the server.
 */
export default async function EventShortUrlPage({ params }: Props) {
  const { shortCode } = await params;
  const event = await getEventByShortCode(shortCode);

  if (!event) {
    notFound();
  }

  return (
    <AppLayoutWrapper>
      <EventDetailClient event={event} />
    </AppLayoutWrapper>
  );
}
