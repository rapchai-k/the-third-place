import { redirect, notFound } from 'next/navigation';
import { getEventById } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Legacy event URL handler.
 * Redirects /events/:id → /e/:shortCode (canonical URL).
 * Keeps old bookmarks and shared links working.
 */
export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  if (event.short_code) {
    redirect(`/e/${event.short_code}`);
  }

  // Fallback: if no short_code exists, return 404
  // (all events should have short_code in production)
  notFound();
}
