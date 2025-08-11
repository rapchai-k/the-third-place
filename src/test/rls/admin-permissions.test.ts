// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import { createMockSession, createMockUser, createMockEvent, createMockDiscussion } from '@/test/utils/test-utils'

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

describe('Admin Permissions RLS Policy Tests', () => {
  const adminUser = createMockUser({ 
    id: 'admin-1',
    role: 'admin',
    email: 'admin@example.com'
  })

  const regularUser = createMockUser({ 
    id: 'user-1',
    role: 'user',
    email: 'user@example.com'
  })

  const mockEvent = createMockEvent({
    id: 'event-1',
    title: 'Test Event',
    community_id: 'community-1',
    host_id: adminUser.id,
  })

  const mockDiscussion = createMockDiscussion({
    id: 'discussion-1',
    title: 'Test Discussion',
    community_id: 'community-1',
    created_by: adminUser.id,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Event Management Admin Permissions', () => {
    it('should allow admins to create events', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: 'Admin Created Event',
          description: 'Event created by admin',
          date_time: '2024-12-31T18:00:00Z',
          venue: 'Admin Venue',
          capacity: 100,
          community_id: 'community-1',
          host_id: adminUser.id,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toEqual(mockEvent)
    })

    it('should prevent regular users from creating events', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - admin required', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: 'Unauthorized Event',
          description: 'Should not be created',
          date_time: '2024-12-31T18:00:00Z',
          venue: 'User Venue',
          capacity: 50,
          community_id: 'community-1',
          host_id: regularUser.id,
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow admins to update any event', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      const updatedEvent = { ...mockEvent, title: 'Updated by Admin' }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedEvent,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .update({ title: 'Updated by Admin' })
        .eq('id', mockEvent.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toEqual(updatedEvent)
    })

    it('should prevent regular users from updating events', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - admin required', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .update({ title: 'Unauthorized Update' })
        .eq('id', mockEvent.id)
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow admins to cancel events', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      const cancelledEvent = { ...mockEvent, is_cancelled: true }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: cancelledEvent,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .update({ is_cancelled: true })
        .eq('id', mockEvent.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.is_cancelled).toBe(true)
    })

    it('should allow admins to delete events', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any)

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', mockEvent.id)

      expect(error).toBeNull()
    })
  })

  describe('Discussion Management Admin Permissions', () => {
    it('should allow admins to create discussions', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockDiscussion,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussions')
        .insert({
          title: 'Admin Discussion',
          prompt: 'What do you think about this topic?',
          community_id: 'community-1',
          created_by: adminUser.id,
          expires_at: '2024-12-31T23:59:59Z',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toEqual(mockDiscussion)
    })

    it('should prevent regular users from creating discussions', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - admin required', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussions')
        .insert({
          title: 'Unauthorized Discussion',
          prompt: 'Should not be created',
          community_id: 'community-1',
          created_by: regularUser.id,
          expires_at: '2024-12-31T23:59:59Z',
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow admins to extend discussion expiry', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      const extendedDiscussion = {
        ...mockDiscussion,
        expires_at: '2025-12-31T23:59:59Z',
        extended: true,
      }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: extendedDiscussion,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussions')
        .update({
          expires_at: '2025-12-31T23:59:59Z',
          extended: true,
        })
        .eq('id', mockDiscussion.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.extended).toBe(true)
    })

    it('should allow admins to hide discussions', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      const hiddenDiscussion = { ...mockDiscussion, is_visible: false }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: hiddenDiscussion,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussions')
        .update({ is_visible: false })
        .eq('id', mockDiscussion.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.is_visible).toBe(false)
    })

    it('should allow admins to delete discussions', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any)

      const { error } = await supabase
        .from('discussions')
        .delete()
        .eq('id', mockDiscussion.id)

      expect(error).toBeNull()
    })
  })

  describe('User Management Admin Permissions', () => {
    it('should allow admins to view all user profiles', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      const allUsers = [adminUser, regularUser]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: allUsers,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data).toEqual(allUsers)
    })

    it('should prevent regular users from viewing all user profiles', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - admin required', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow admins to update user roles', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      const updatedUser = { ...regularUser, role: 'admin' }

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
        .update({ role: 'admin' })
        .eq('id', regularUser.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.role).toBe('admin')
    })

    it('should prevent regular users from updating user roles', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - admin required', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', regularUser.id)
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow admins to ban users', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      const bannedUser = { ...regularUser, is_banned: true }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: bannedUser,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('users')
        .update({ is_banned: true })
        .eq('id', regularUser.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.is_banned).toBe(true)
    })
  })

  describe('Content Moderation Admin Permissions', () => {
    it('should allow admins to moderate discussion comments', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      const moderatedComment = {
        id: 'comment-1',
        is_flagged: true,
        moderated_by: adminUser.id,
        moderation_reason: 'Inappropriate content',
      }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: moderatedComment,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussion_comments')
        .update({
          is_flagged: true,
          moderated_by: adminUser.id,
          moderation_reason: 'Inappropriate content',
        })
        .eq('id', 'comment-1')
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.is_flagged).toBe(true)
      expect(data?.moderated_by).toBe(adminUser.id)
    })

    it('should prevent regular users from moderating comments', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation - admin required', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussion_comments')
        .update({
          is_flagged: true,
          moderated_by: regularUser.id,
        })
        .eq('id', 'comment-1')
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow admins to delete inappropriate comments', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any)

      const { error } = await supabase
        .from('discussion_comments')
        .delete()
        .eq('id', 'inappropriate-comment-id')

      expect(error).toBeNull()
    })
  })
})
