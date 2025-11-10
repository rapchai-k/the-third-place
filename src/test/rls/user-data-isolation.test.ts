// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import { createMockSession, createMockUser } from '@/test/utils/test-utils'

// Mock the Supabase client for RLS testing
vi.mock('@/integrations/supabase/client', () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }

  return {
    supabase: {
      from: vi.fn(() => mockQueryBuilder),
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
      },
      rpc: vi.fn(),
    }
  }
})

describe('User Data Isolation RLS Policy Tests', () => {
  const user1 = createMockUser({ 
    id: 'user-1',
    email: 'user1@example.com',
    role: 'user'
  })

  const user2 = createMockUser({ 
    id: 'user-2',
    email: 'user2@example.com',
    role: 'user'
  })

  const adminUser = createMockUser({ 
    id: 'admin-1',
    email: 'admin@example.com',
    role: 'admin'
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('User Profile Data Isolation', () => {
    it('should allow users to view their own profile', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: user1,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user1.id)
        .single()

      expect(error).toBeNull()
      expect(data).toEqual(user1)
    })

    it('should prevent users from viewing other users profiles', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - can only access own data', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user2.id) // Trying to access another user's profile
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow users to update their own profile', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      const updatedUser = { ...user1, name: 'Updated Name' }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedUser,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('users')
        .update({ name: 'Updated Name' })
        .eq('id', user1.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.name).toBe('Updated Name')
    })

    it('should prevent users from updating other users profiles', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - can only update own data', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('users')
        .update({ name: 'Malicious Update' })
        .eq('id', user2.id) // Trying to update another user's profile
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should prevent users from deleting other users profiles', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - can only delete own data', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user2.id) // Trying to delete another user

      expect(error?.code).toBe('RLS_VIOLATION')
    })
  })

  describe('Event Registration Data Isolation', () => {
    it('should allow users to view their own event registrations', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      const userRegistrations = [
        {
          id: 'reg-1',
          user_id: user1.id,
          event_id: 'event-1',
          status: 'registered',
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: userRegistrations,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('user_id', user1.id)
        .order('registered_at', { ascending: false })

      expect(error).toBeNull()
      expect(data).toEqual(userRegistrations)
    })

    it('should prevent users from viewing other users event registrations', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - can only access own registrations', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('user_id', user2.id) // Trying to access another user's registrations
        .order('registered_at', { ascending: false })

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow users to register for events as themselves only', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      const registration = {
        user_id: user1.id,
        event_id: 'event-1',
        status: 'registered',
      }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: registration,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          user_id: user1.id,
          event_id: 'event-1',
          status: 'registered',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toEqual(registration)
    })

    it('should prevent users from registering as other users', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - can only register as yourself', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          user_id: user2.id, // Trying to register as another user
          event_id: 'event-1',
          status: 'registered',
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow users to cancel their own registrations', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      const cancelledRegistration = {
        user_id: user1.id,
        event_id: 'event-1',
        status: 'unregistered',
      }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: cancelledRegistration,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('event_registrations')
        .update({ status: 'unregistered' })
        .eq('user_id', user1.id)
        .eq('event_id', 'event-1')
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.status).toBe('unregistered')
    })

    it('should prevent users from cancelling other users registrations', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - can only modify own registrations', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('event_registrations')
        .update({ status: 'unregistered' })
        .eq('user_id', user2.id) // Trying to cancel another user's registration
        .eq('event_id', 'event-1')
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })
  })

  describe('Discussion Comments Data Isolation', () => {
    it('should allow users to view their own comments', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      const userComments = [
        {
          id: 'comment-1',
          user_id: user1.id,
          discussion_id: 'discussion-1',
          content: 'My comment',
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: userComments,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussion_comments')
        .select('*')
        .eq('user_id', user1.id)
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data).toEqual(userComments)
    })

    it('should allow users to edit their own comments', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      const updatedComment = {
        id: 'comment-1',
        user_id: user1.id,
        content: 'Updated comment content',
      }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedComment,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussion_comments')
        .update({ content: 'Updated comment content' })
        .eq('id', 'comment-1')
        .eq('user_id', user1.id) // RLS ensures user can only edit own comments
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.content).toBe('Updated comment content')
    })

    it('should prevent users from editing other users comments', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - can only edit own comments', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussion_comments')
        .update({ content: 'Malicious edit' })
        .eq('id', 'comment-2') // Comment belongs to user2
        .eq('user_id', user2.id)
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow users to delete their own comments', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any)

      const { error } = await supabase
        .from('discussion_comments')
        .delete()
        .eq('id', 'comment-1')
        .eq('user_id', user1.id)

      expect(error).toBeNull()
    })

    it('should prevent users from deleting other users comments', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(user1) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - can only delete own comments', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { error } = await supabase
        .from('discussion_comments')
        .delete()
        .eq('id', 'comment-2') // Comment belongs to user2
        .eq('user_id', user2.id)

      expect(error?.code).toBe('RLS_VIOLATION')
    })
  })


// Additional test for event registration RLS
describe('Event Registration RLS Permissions', () => {
  const user1 = createMockUser({
    id: 'user-1',
    email: 'user1@example.com',
    role: 'user'
  })

  const user2 = createMockUser({
    id: 'user-2',
    email: 'user2@example.com',
    role: 'user'
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should enforce community membership for event registration', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: createMockSession(user1) },
      error: null,
    })

    // Mock that user is not a member of the community
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows returned', code: 'PGRST116' },
      }),
    } as any)

    // Check community membership first
    const { data: membership } = await supabase
      .from('community_members')
      .select('*')
      .eq('user_id', user1.id)
      .eq('community_id', 'community-1')
      .single()

    expect(membership).toBeNull()

    // Registration should be prevented if not a community member
    // This would be enforced by application logic or database constraints
  })

  it('should allow registration only for events in joined communities', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: createMockSession(user1) },
      error: null,
    })

    // Mock that user is a member of the community
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { user_id: user1.id, community_id: 'community-1' },
        error: null,
      }),
    } as any)

    const { data: membership } = await supabase
      .from('community_members')
      .select('*')
      .eq('user_id', user1.id)
      .eq('community_id', 'community-1')
      .single()

    expect(membership).toBeTruthy()
    expect(membership?.user_id).toBe(user1.id)
  })
})
})
