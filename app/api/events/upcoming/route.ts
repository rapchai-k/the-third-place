import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
  const offset = Number(searchParams.get('offset')) || 0;
  const city = searchParams.get('city');

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('events')
    .select(`
      id, title, description, date_time, venue, capacity,
      image_url, price, currency, external_link, short_code,
      communities(name, city)
    `)
    .eq('is_cancelled', false)
    .gte('date_time', new Date().toISOString())
    .order('date_time', { ascending: true })
    .range(offset, offset + limit - 1);

  if (city) {
    query = query.eq('communities.city', city);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error.message, code: error.code },
      { status: 500, headers: corsHeaders }
    );
  }

  const events = (data || [])
    .filter((e) => !city || e.communities !== null)
    .map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date_time: event.date_time,
      venue: event.venue,
      capacity: event.capacity,
      image_url: event.image_url,
      price: event.price,
      currency: event.currency,
      external_link: event.external_link,
      short_code: event.short_code,
      community: event.communities
        ? { name: event.communities.name, city: event.communities.city }
        : null,
    }));

  return NextResponse.json(
    { events, count: events.length },
    { headers: corsHeaders }
  );
}
