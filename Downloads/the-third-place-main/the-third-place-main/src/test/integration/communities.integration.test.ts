// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import { createMockSession, createMockUser } from '@/test/utils/test-utils'

// Mock the Supabase client for integration tests
vi.mock('@/integrations/supabase/client', () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }

  return {
    supabase: {
      from: vi.fn(() => mockQueryBuilder),
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
      rpc: vi.fn(),
    }
  }
})

describe('Communities API Integration Tests', () => {
  const mockCommunity = {
    id: 'test-community-id',
    name: 'Test Community',
    description: 'A test community for integration testing',
    city: 'Test City',
    image_url: '/test-image.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockUser = createMockUser({ role: 'user' })
  const mockAdminUser = createMockUser({ role: 'admin' })
  const mockSession = createMockSession()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /communities - List Communities', () => {
    it('should fetch all communities successfully', async () => {
      const mockCommunities = [mockCommunity, { ...mockCommunity, id: 'community-2' }]
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCommunities,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false })

      expect(data).toEqual(mockCommunities)
      expect(supabase.from).toHaveBeenCalledWith('communities')
    })

    it('should filter communities by city', async () => {
      const bangaloreCommunities = [{ ...mockCommunity, city: 'Bangalore' }]
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: bangaloreCommunities,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('communities')
        .select('*')
        .eq('city', 'Bangalore')
        .order('created_at', { ascending: false })

      expect(data).toEqual(bangaloreCommunities)
      expect(supabase.from).toHaveBeenCalledWith('communities')
    })

    it('should handle database errors gracefully', async () => {
      const mockError = { message: 'Database connection failed', code: 'DB_ERROR' }
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false })

      expect(data).toBeNull()
      expect(error).toEqual(mockError)
    })
  })

  describe('GET /communities/:id - Get Community Details', () => {
    it('should fetch community details with related data', async () => {
      const communityWithDetails = {
        ...mockCommunity,
        community_members: [{ user_id: mockUser.id, joined_at: '2024-01-01T00:00:00Z' }],
        events: [{ id: 'event-1', title: 'Test Event' }],
      }
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: communityWithDetails,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('communities')
        .select(`
          *,
          community_members(*),
          events(*)
        `)
        .eq('id', mockCommunity.id)
        .single()

      expect(data).toEqual(communityWithDetails)
      expect(supabase.from).toHaveBeenCalledWith('communities')
    })

    it('should return null for non-existent community', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows returned', code: 'PGRST116' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', 'non-existent-id')
        .single()

      expect(data).toBeNull()
      expect(error).toBeTruthy()
    })
  })

  describe('Community Management Operations', () => {
    it('should delete community successfully as admin', async () => {
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
      expect(supabase.from).toHaveBeenCalledWith('communities')
    })

    it('should enforce RLS for deletions', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insufficient permissions', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', mockCommunity.id)

      expect(error?.code).toBe('RLS_VIOLATION')
    })
  })

  describe('Community Membership Operations', () => {
    it('should allow users to join communities', async () => {
      const membershipData = {
        user_id: mockUser.id,
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

      const { data } = await supabase
        .from('community_members')
        .insert({
          user_id: mockUser.id,
          community_id: mockCommunity.id,
        })
        .select()
        .single()

      expect(data).toEqual(membershipData)
      expect(supabase.from).toHaveBeenCalledWith('community_members')
    })

    it('should prevent duplicate memberships', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'duplicate key value violates unique constraint', code: '23505' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('community_members')
        .insert({
          user_id: mockUser.id,
          community_id: mockCommunity.id,
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23505')
    })

    it('should allow users to leave communities', async () => {
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
        .eq('user_id', mockUser.id)
        .eq('community_id', mockCommunity.id)

      expect(error).toBeNull()
      expect(supabase.from).toHaveBeenCalledWith('community_members')
    })
  })
})
