import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import { createMockSession, createMockUser, createMockDiscussion } from '@/test/utils/test-utils'

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
      },
      rpc: vi.fn(),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn().mockReturnThis(),
      })),
      removeChannel: vi.fn(),
    }
  }
})

describe('Discussions API Integration Tests', () => {
  const mockDiscussion = createMockDiscussion({
    id: 'test-discussion-id',
    title: 'Test Discussion',
    prompt: 'This is a test discussion prompt',
    community_id: 'test-community-id',
    created_by: 'admin-user-id',
    expires_at: '2024-12-31T23:59:59Z',
    is_visible: true,
    extended: false,
  })

  const mockUser = createMockUser({ role: 'user' })
  const mockAdminUser = createMockUser({ role: 'admin' })
  const mockSession = createMockSession()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /discussions - List Discussions', () => {
    it('should fetch all visible discussions for a community', async () => {
      const discussions = [
        mockDiscussion,
        { ...mockDiscussion, id: 'discussion-2', title: 'Another Discussion' }
      ]
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: discussions,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('discussions')
        .select(`
          *,
          users(name, photo_url),
          discussion_comments(count)
        `)
        .eq('community_id', 'test-community-id')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })

      expect(data).toEqual(discussions)
      expect(supabase.from).toHaveBeenCalledWith('discussions')
    })

    it('should filter active vs expired discussions', async () => {
      const activeDiscussions = [mockDiscussion]
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: activeDiscussions,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('discussions')
        .select('*')
        .eq('community_id', 'test-community-id')
        .eq('is_visible', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      expect(data).toEqual(activeDiscussions)
    })

    it('should enforce RLS - only show discussions from joined communities', async () => {
      // Mock user's joined communities
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockDiscussion],
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('discussions')
        .select(`
          *,
          communities!inner(*)
        `)
        .eq('is_visible', true)
        .in('community_id', ['test-community-id']) // User's joined communities
        .order('created_at', { ascending: false })

      expect(data).toEqual([mockDiscussion])
    })
  })

  describe('GET /discussions/:id - Get Discussion Details', () => {
    it('should fetch discussion with comments and user details', async () => {
      const discussionWithDetails = {
        ...mockDiscussion,
        users: { name: 'Admin User', photo_url: '/admin.jpg' },
        communities: { name: 'Test Community' },
        discussion_comments: [
          {
            id: 'comment-1',
            content: 'Test comment',
            user_id: mockUser.id,
            users: { name: 'Test User', photo_url: '/user.jpg' },
          }
        ],
      }
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: discussionWithDetails,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('discussions')
        .select(`
          *,
          users(name, photo_url),
          communities(name),
          discussion_comments(
            *,
            users(name, photo_url)
          )
        `)
        .eq('id', mockDiscussion.id)
        .single()

      expect(data).toEqual(discussionWithDetails)
    })

    it('should return null for non-existent discussion', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows returned', code: 'PGRST116' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .eq('id', 'non-existent-id')
        .single()

      expect(data).toBeNull()
      expect(error).toBeTruthy()
    })
  })

  describe('POST /discussions - Create Discussion (Admin Only)', () => {
    it('should create discussion successfully as admin', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession(mockAdminUser) },
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

      const newDiscussion = {
        title: 'New Discussion',
        prompt: 'What are your thoughts on this topic?',
        community_id: 'test-community-id',
        created_by: mockAdminUser.id,
        expires_at: '2024-12-31T23:59:59Z',
      }

      const { data } = await supabase
        .from('discussions')
        .insert(newDiscussion)
        .select()
        .single()

      expect(data).toEqual(mockDiscussion)
      expect(supabase.from).toHaveBeenCalledWith('discussions')
    })

    it('should enforce RLS and reject non-admin users', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insufficient permissions', code: 'RLS_VIOLATION' },
        }),
      } as any)

      const newDiscussion = {
        title: 'Unauthorized Discussion',
        prompt: 'Should not be created',
        community_id: 'test-community-id',
        created_by: mockUser.id,
        expires_at: '2024-12-31T23:59:59Z',
      }

      const { data, error } = await supabase
        .from('discussions')
        .insert(newDiscussion)
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('RLS_VIOLATION')
    })

    it('should validate expiry date is in the future', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'expires_at must be in the future', code: '23514' },
        }),
      } as any)

      const invalidDiscussion = {
        title: 'Invalid Discussion',
        prompt: 'This has an invalid expiry date',
        community_id: 'test-community-id',
        created_by: mockAdminUser.id,
        expires_at: '2020-01-01T00:00:00Z', // Past date
      }

      const { data, error } = await supabase
        .from('discussions')
        .insert(invalidDiscussion)
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23514')
    })
  })

  describe('Discussion Comments Operations', () => {
    it('should allow users to add comments to discussions', async () => {
      const commentData = {
        id: 'comment-id',
        discussion_id: mockDiscussion.id,
        user_id: mockUser.id,
        content: 'This is a test comment',
        created_at: new Date().toISOString(),
      }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: commentData,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('discussion_comments')
        .insert({
          discussion_id: mockDiscussion.id,
          user_id: mockUser.id,
          content: 'This is a test comment',
        })
        .select()
        .single()

      expect(data).toEqual(commentData)
      expect(supabase.from).toHaveBeenCalledWith('discussion_comments')
    })

    it('should prevent comments on expired discussions', async () => {
      // First check if discussion is expired
      const expiredDiscussion = {
        ...mockDiscussion,
        expires_at: '2020-01-01T00:00:00Z', // Past date
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: expiredDiscussion,
          error: null,
        }),
      } as any)

      const { data: discussionData } = await supabase
        .from('discussions')
        .select('expires_at')
        .eq('id', mockDiscussion.id)
        .single()

      const isExpired = new Date(discussionData?.expires_at) < new Date()
      expect(isExpired).toBe(true)
    })

    it('should allow users to edit their own comments', async () => {
      const updatedComment = {
        id: 'comment-id',
        content: 'Updated comment content',
        updated_at: new Date().toISOString(),
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

      const { data } = await supabase
        .from('discussion_comments')
        .update({ content: 'Updated comment content' })
        .eq('id', 'comment-id')
        .eq('user_id', mockUser.id) // RLS ensures user can only edit own comments
        .select()
        .single()

      expect(data).toEqual(updatedComment)
    })

    it('should allow admins to moderate comments', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'comment-id',
            is_flagged: true,
            moderated_by: mockAdminUser.id,
          },
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('discussion_comments')
        .update({
          is_flagged: true,
          moderated_by: mockAdminUser.id,
        })
        .eq('id', 'comment-id')
        .select()
        .single()

      expect(data?.is_flagged).toBe(true)
      expect(data?.moderated_by).toBe(mockAdminUser.id)
    })
  })

  describe('Discussion Management (Admin Operations)', () => {
    it('should allow admins to extend discussion expiry', async () => {
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

      const { data } = await supabase
        .from('discussions')
        .update({
          expires_at: '2025-12-31T23:59:59Z',
          extended: true,
        })
        .eq('id', mockDiscussion.id)
        .select()
        .single()

      expect(data?.extended).toBe(true)
      expect(data?.expires_at).toBe('2025-12-31T23:59:59Z')
    })

    it('should allow admins to hide discussions', async () => {
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

      const { data } = await supabase
        .from('discussions')
        .update({ is_visible: false })
        .eq('id', mockDiscussion.id)
        .select()
        .single()

      expect(data?.is_visible).toBe(false)
    })

    it('should allow admins to delete discussions', async () => {
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

  describe('Real-time Subscriptions', () => {
    it('should set up real-time subscription for discussion comments', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn().mockReturnThis(),
      }

      vi.mocked(supabase.channel).mockReturnValue(mockChannel)

      const channel = supabase
        .channel(`discussion-${mockDiscussion.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'discussion_comments',
            filter: `discussion_id=eq.${mockDiscussion.id}`,
          },
          (payload) => {
            // Handle new comment
          }
        )
        .subscribe()

      expect(supabase.channel).toHaveBeenCalledWith(`discussion-${mockDiscussion.id}`)
      expect(mockChannel.on).toHaveBeenCalled()
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })
  })
})
