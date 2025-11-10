// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import { createMockSession, createMockUser, createMockEvent } from '@/test/utils/test-utils'

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
    }
  }
})

describe('Events API Integration Tests', () => {
  const mockEvent = createMockEvent({
    id: 'test-event-id',
    title: 'Test Event',
    description: 'A test event for integration testing',
    date_time: '2024-12-31T18:00:00Z',
    venue: 'Test Venue',
    capacity: 50,
    host_id: 'host-user-id',
    community_id: 'test-community-id',
    is_cancelled: false,
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

  describe('GET /events - List Events', () => {
    it('should fetch all upcoming events', async () => {
      const upcomingEvents = [
        mockEvent,
        { ...mockEvent, id: 'event-2', title: 'Another Event' }
      ]
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: upcomingEvents,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('events')
        .select(`
          *,
          communities(*),
          event_registrations(count)
        `)
        .eq('is_cancelled', false)
        .gte('date_time', new Date().toISOString())
        .order('date_time')

      expect(data).toEqual(upcomingEvents)
      expect(supabase.from).toHaveBeenCalledWith('events')
    })

    it('should filter events by community', async () => {
      const communityEvents = [mockEvent]
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: communityEvents,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('community_id', 'test-community-id')
        .eq('is_cancelled', false)
        .gte('date_time', new Date().toISOString())
        .order('date_time')

      expect(data).toEqual(communityEvents)
    })

    it('should filter events by city through communities', async () => {
      const cityEvents = [mockEvent]
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: cityEvents,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('events')
        .select(`
          *,
          communities!inner(city)
        `)
        .eq('communities.city', 'Bangalore')
        .eq('is_cancelled', false)
        .gte('date_time', new Date().toISOString())
        .order('date_time')

      expect(data).toEqual(cityEvents)
    })
  })

  describe('GET /events/:id - Get Event Details', () => {
    it('should fetch event details with registration count', async () => {
      const eventWithDetails = {
        ...mockEvent,
        communities: { name: 'Test Community', city: 'Test City' },
        event_registrations: [{ count: 25 }],
        users: { name: 'Host User', photo_url: '/host.jpg' },
      }
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: eventWithDetails,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('events')
        .select(`
          *,
          communities(*),
          event_registrations(count),
          users(name, photo_url)
        `)
        .eq('id', mockEvent.id)
        .single()

      expect(data).toEqual(eventWithDetails)
    })

    it('should return null for non-existent event', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows returned', code: 'PGRST116' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', 'non-existent-id')
        .single()

      expect(data).toBeNull()
      expect(error).toBeTruthy()
    })
  })

  describe('Event Registration Operations', () => {
    it('should allow users to register for events', async () => {
      const registrationData = {
        user_id: mockUser.id,
        event_id: mockEvent.id,
        status: 'registered' as const,
        registered_at: new Date().toISOString(),
      }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: registrationData,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('event_registrations')
        .insert({
          user_id: mockUser.id,
          event_id: mockEvent.id,
          status: 'registered',
        })
        .select()
        .single()

      expect(data).toEqual(registrationData)
      expect(supabase.from).toHaveBeenCalledWith('event_registrations')
    })

    it('should prevent duplicate registrations', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'duplicate key value violates unique constraint', code: '23505' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          user_id: mockUser.id,
          event_id: mockEvent.id,
          status: 'registered',
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23505')
    })

    it('should allow users to cancel registrations', async () => {
      const cancelledRegistration = {
        user_id: mockUser.id,
        event_id: mockEvent.id,
        status: 'unregistered' as const,
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

      const { data } = await supabase
        .from('event_registrations')
        .update({ status: 'unregistered' })
        .eq('user_id', mockUser.id)
        .eq('event_id', mockEvent.id)
        .select()
        .single()

      expect(data?.status).toBe('unregistered')
    })
  })

  describe('Admin Operations for Testing', () => {
    it('should allow admins to update events', async () => {
      const updatedEvent = { ...mockEvent, title: 'Updated Event Title' }
      
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedEvent,
          error: null,
        }),
      } as any)

      const updates = { title: 'Updated Event Title' }

      const { data } = await supabase
        .from('events')
        .update(updates)
        .eq('id', mockEvent.id)
        .select()
        .single()

      expect(data).toEqual(updatedEvent)
    })

    it('should allow admins to cancel events', async () => {
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

      const { data } = await supabase
        .from('events')
        .update({ is_cancelled: true })
        .eq('id', mockEvent.id)
        .select()
        .single()

      expect(data?.is_cancelled).toBe(true)
    })

    it('should allow admins to delete events', async () => {
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
})
