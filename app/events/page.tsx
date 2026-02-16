/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from 'next';
import { getEvents, getPastEvents } from '@/lib/supabase/server';
import EventsClient from '@/views/Events';
import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper';

/**
 * Static metadata for the events listing page.
 */
export const metadata: Metadata = {
  title: 'Upcoming Events | My Third Place',
  description: 'Discover and register for events in your community. Find exciting activities, workshops, and gatherings happening near you.',
  openGraph: {
    title: 'Upcoming Events | My Third Place',
    description: 'Discover and register for events in your community.',
    type: 'website',
    siteName: 'My Third Place',
  },
  twitter: {
    card: 'summary',
    title: 'Upcoming Events | My Third Place',
    description: 'Discover and register for events in your community.',
  },
};

/**
 * Server Component - fetches initial events data on the server.
 * Client Component handles filters, search, and pagination.
 */
export default async function EventsPage() {
  const [events, pastEvents] = await Promise.all([
    getEvents({ limit: 20 }),
    getPastEvents({ limit: 12 }),
  ]);

  return (
    <AppLayoutWrapper>
      <EventsClient initialEvents={events} initialPastEvents={pastEvents} />
    </AppLayoutWrapper>
  );
}
