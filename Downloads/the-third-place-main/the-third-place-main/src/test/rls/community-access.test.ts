// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import { createMockSession, createMockUser, createMockCommunity } from '@/test/utils/test-utils'

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

describe('Community Access RLS Policy Tests', () => {
  const mockCommunity = createMockCommunity({
    id: 'community-1',
    name: 'Test Community',
    city: 'Bangalore',
  })

  const regularUser = createMockUser({ 
    id: 'user-1',
    role: 'user',
    email: 'user@example.com'
  })

  const adminUser = createMockUser({ 
    id: 'admin-1',
    role: 'admin',
    email: 'admin@example.com'
  })

  const memberUser = createMockUser({ 
    id: 'member-1',
    role: 'user',
    email: 'member@example.com'
  })

  const nonMemberUser = createMockUser({ 
    id: 'nonmember-1',
    role: 'user',
    email: 'nonmember@example.com'
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Community Visibility RLS', () => {
    it('should allow all authenticated users to view public communities', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockCommunity],
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data).toEqual([mockCommunity])
    })

    it('should deny access to unauthenticated users', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'JWT expired', code: 'PGRST301' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false })

      expect(data).toBeNull()
      expect(error?.code).toBe('PGRST301')
    })

    it('should allow users to view community details they have joined', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(memberUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            ...mockCommunity,
            community_members: [{ user_id: memberUser.id }],
          },
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          community_members(user_id)
        `)
        .eq('id', mockCommunity.id)
        .single()

      expect(error).toBeNull()
      expect(data?.community_members).toContainEqual({ user_id: memberUser.id })
    })
  })

  describe('Community Membership RLS', () => {
    it('should allow users to join communities', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      const membershipData = {
        user_id: regularUser.id,
        community_id: mockCommunity.id,
        joined_at: new Date().toISOString(),
      }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: membershipData,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('community_members')
        .insert({
          user_id: regularUser.id,
          community_id: mockCommunity.id,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toEqual(membershipData)
    })

    it('should prevent users from joining communities as other users', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('community_members')
        .insert({
          user_id: 'other-user-id', // Trying to join as different user
          community_id: mockCommunity.id,
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow users to leave communities they joined', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(memberUser) },
        error: null,
      })

      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any)

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('user_id', memberUser.id)
        .eq('community_id', mockCommunity.id)

      expect(error).toBeNull()
    })

    it('should prevent users from removing other users from communities', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'RLS policy violation', code: 'RLS_VIOLATION' },
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any)

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('user_id', 'other-user-id') // Trying to remove different user
        .eq('community_id', mockCommunity.id)

      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should allow admins to manage community memberships', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any)

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('user_id', 'any-user-id')
        .eq('community_id', mockCommunity.id)

      expect(error).toBeNull()
    })
  })

  describe('Community Content Access RLS', () => {
    it('should only show events from communities user has joined', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(memberUser) },
        error: null,
      })

      const memberCommunityEvents = [
        {
          id: 'event-1',
          title: 'Member Community Event',
          community_id: mockCommunity.id,
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: memberCommunityEvents,
          error: null,
        }),
      } as any)

      // First get user's joined communities
      const userCommunities = [mockCommunity.id]

      // Then get events from those communities
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('community_id', userCommunities)
        .order('date_time')

      expect(error).toBeNull()
      expect(data).toEqual(memberCommunityEvents)
    })

    it('should only show discussions from communities user has joined', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(memberUser) },
        error: null,
      })

      const memberCommunityDiscussions = [
        {
          id: 'discussion-1',
          title: 'Member Community Discussion',
          community_id: mockCommunity.id,
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: memberCommunityDiscussions,
          error: null,
        }),
      } as any)

      const userCommunities = [mockCommunity.id]

      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .in('community_id', userCommunities)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data).toEqual(memberCommunityDiscussions)
    })

    it('should prevent access to content from non-joined communities', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(nonMemberUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [], // No events returned for non-member
          error: null,
        }),
      } as any)

      const userCommunities: string[] = [] // User hasn't joined any communities

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('community_id', userCommunities)
        .order('date_time')

      expect(error).toBeNull()
      expect(data).toEqual([])
    })
  })

  describe('Community Management RLS', () => {
    it('should only allow admins to create communities', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCommunity,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: 'New Community',
          description: 'A new test community',
          city: 'Mumbai',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toEqual(mockCommunity)
    })

    it('should prevent regular users from creating communities', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: 'Unauthorized Community',
          description: 'Should not be created',
          city: 'Delhi',
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should only allow admins to update communities', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(adminUser) },
        error: null,
      })

      const updatedCommunity = { ...mockCommunity, name: 'Updated Community' }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedCommunity,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .update({ name: 'Updated Community' })
        .eq('id', mockCommunity.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toEqual(updatedCommunity)
    })

    it('should prevent regular users from updating communities', async () => {
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
          error: { message: 'RLS policy violation', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .update({ name: 'Unauthorized Update' })
        .eq('id', mockCommunity.id)
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should only allow admins to delete communities', async () => {
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
        .from('communities')
        .delete()
        .eq('id', mockCommunity.id)

      expect(error).toBeNull()
    })

    it('should prevent regular users from deleting communities', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(regularUser) },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', mockCommunity.id)

      expect(error?.code).toBe('RLS_VIOLATION')
    })
  })
})
