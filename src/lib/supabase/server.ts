import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/integrations/supabase/types';
import type { User, Session } from '@supabase/supabase-js';

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
 * Get the authenticated user from the server-side session.
 * This function should be used in Server Components to access the current user.
 *
 * IMPORTANT: This calls getUser() which validates the JWT with Supabase Auth server,
 * making it secure for authorization checks. Do NOT use getSession() for this purpose.
 *
 * Usage:
 * ```ts
 * import { getServerUser } from '@/lib/supabase/server';
 *
 * export default async function Page() {
 *   const user = await getServerUser();
 *   if (!user) {
 *     redirect('/auth');
 *   }
 *   return <div>Hello, {user.email}</div>;
 * }
 * ```
 *
 * @returns The authenticated User object, or null if not authenticated
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // Log error but don't throw - unauthenticated is a valid state
      console.error('Error getting server user:', {
        message: error.message,
        status: error.status,
      });
      return null;
    }

    return user;
  } catch (error) {
    console.error('Unexpected error in getServerUser:', error);
    return null;
  }
}

/**
 * Get the current session from the server-side cookies.
 * This function provides access to the full session including access/refresh tokens.
 *
 * NOTE: For authorization checks, prefer getServerUser() as it validates the JWT.
 * Use getServerSession() only when you need session metadata (e.g., token expiry).
 *
 * Usage:
 * ```ts
 * import { getServerSession } from '@/lib/supabase/server';
 *
 * export default async function Page() {
 *   const session = await getServerSession();
 *   if (session) {
 *     console.log('Token expires at:', session.expires_at);
 *   }
 *   return <div>...</div>;
 * }
 * ```
 *
 * @returns The current Session object, or null if no session exists
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting server session:', {
        message: error.message,
        status: error.status,
      });
      return null;
    }

    return session;
  } catch (error) {
    console.error('Unexpected error in getServerSession:', error);
    return null;
  }
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

// ============================================================================
// Listing Page Data Fetchers (Phase 4: SSR for listing pages)
// ============================================================================

/**
 * Options for fetching listing data
 */
export interface ListingOptions {
  limit?: number;
  offset?: number;
}

/**
 * Type-safe event list item for SSR
 */
export type EventListItem = Database['public']['Tables']['events']['Row'] & {
  communities: { name: string; city: string } | null;
  event_registrations: { count: number }[];
  event_tags: { tags: { name: string } | null }[];
};

/**
 * Fetch events list for SSR.
 * Returns upcoming events (future or null dates) ordered by date.
 */
export async function getEvents(options: ListingOptions = {}): Promise<EventListItem[]> {
  const { limit = 20 } = options;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      communities(name, city),
      event_registrations(count),
      event_tags(tags(name))
    `)
    .eq('is_cancelled', false)
    .order('date_time', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  // Filter to include events with null dates or future dates
  const filtered = (data || []).filter(
    (event) => !event.date_time || new Date(event.date_time) >= new Date()
  );

  return filtered as EventListItem[];
}

/**
 * Type-safe community list item for SSR
 */
export type CommunityListItem = Database['public']['Tables']['communities']['Row'] & {
  community_members: { count: number }[];
};

/**
 * Fetch communities list for SSR.
 */
export async function getCommunities(options: ListingOptions = {}): Promise<CommunityListItem[]> {
  const { limit = 20 } = options;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('communities')
    .select(`
      *,
      community_members(count)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching communities:', error);
    return [];
  }

  return (data || []) as CommunityListItem[];
}

/**
 * Type-safe discussion list item for SSR
 */
export type DiscussionListItem = Database['public']['Tables']['discussions']['Row'] & {
  communities: { name: string; id: string } | null;
  users: { name: string; photo_url: string | null } | null;
  discussion_comments: { count: number }[];
};

/**
 * Fetch visible discussions list for SSR.
 */
export async function getDiscussions(options: ListingOptions = {}): Promise<DiscussionListItem[]> {
  const { limit = 20 } = options;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('discussions')
    .select(`
      *,
      communities(name, id),
      users(name, photo_url),
      discussion_comments(count)
    `)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching discussions:', error);
    return [];
  }

  return (data || []) as DiscussionListItem[];
}

/**
 * Fetch featured data for home page SSR.
 * Returns a subset of communities and events for initial render.
 */
export async function getHomePageData() {
  const [communities, events] = await Promise.all([
    getCommunities({ limit: 6 }),
    getEvents({ limit: 4 }),
  ]);

  return { communities, events };
}
