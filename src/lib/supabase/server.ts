import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/integrations/supabase/types';

/**
 * Creates a Supabase client for use in Server Components.
 * This client is read-only and uses cookies for authentication.
 * 
 * Usage:
 * ```ts
 * import { createServerSupabaseClient } from '@/lib/supabase/server';
 * 
 * export default async function Page() {
 *   const supabase = await createServerSupabaseClient();
 *   const { data } = await supabase.from('events').select('*');
 *   return <div>{JSON.stringify(data)}</div>;
 * }
 * ```
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  // Support both naming conventions for the anon key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).'
    );
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Type-safe event data with relations for SSR
 */
export type EventWithRelations = Database['public']['Tables']['events']['Row'] & {
  communities: {
    id: string;
    name: string;
    city: string;
  } | null;
  event_registrations: { count: number }[];
  event_tags: {
    tags: { name: string } | null;
  }[];
  users: {
    name: string;
    photo_url: string | null;
  } | null;
};

/**
 * Fetch a single event by ID with all relations needed for the detail page.
 * Used in Server Components for SSR.
 */
export async function getEventById(id: string): Promise<EventWithRelations | null> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      communities(id, name, city),
      event_registrations(count),
      event_tags(
        tags(name)
      ),
      users!events_host_id_fkey(name, photo_url)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching event:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  return data as EventWithRelations;
}

/**
 * Type-safe community data with relations for SSR
 */
export type CommunityWithRelations = Database['public']['Tables']['communities']['Row'] & {
  community_members: { count: number }[];
};

/**
 * Fetch a single community by ID with all relations needed for the detail page.
 * Used in Server Components for SSR.
 */
export async function getCommunityById(id: string): Promise<CommunityWithRelations | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('communities')
    .select(`
      *,
      community_members(count)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching community:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  return data as CommunityWithRelations;
}

/**
 * Type-safe discussion data with relations for SSR
 */
export type DiscussionWithRelations = Database['public']['Tables']['discussions']['Row'] & {
  communities: {
    name: string;
  } | null;
  users: {
    name: string;
    photo_url: string | null;
  } | null;
  discussion_comments: { count: number }[];
};

/**
 * Fetch a single discussion by ID with all relations needed for the detail page.
 * Used in Server Components for SSR.
 */
export async function getDiscussionById(id: string): Promise<DiscussionWithRelations | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('discussions')
    .select(`
      *,
      communities(name),
      users(name, photo_url),
      discussion_comments(count)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching discussion:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  return data as DiscussionWithRelations;
}
