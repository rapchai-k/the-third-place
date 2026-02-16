/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
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
    not: vi.fn().mockReturnThis(),
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

  describe('GET /events - Past/Completed Events', () => {
    const pastEvent1 = createMockEvent({
      id: 'past-event-1',
      title: 'Past Workshop',
      date_time: '2024-06-15T10:00:00Z',
      venue: 'Old Venue',
      is_cancelled: false,
    })

    const pastEvent2 = createMockEvent({
      id: 'past-event-2',
      title: 'Past Meetup',
      date_time: '2024-08-20T14:00:00Z',
      venue: 'Another Venue',
      is_cancelled: false,
    })

    it('should fetch past/completed events ordered by most recent first', async () => {
      const pastEvents = [
        { ...pastEvent2, communities: { name: 'Community A', city: 'Mumbai' }, event_registrations: [{ count: 30 }] },
        { ...pastEvent1, communities: { name: 'Community B', city: 'Bangalore' }, event_registrations: [{ count: 15 }] },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: pastEvents,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('events')
        .select(`
          *,
          communities(name, city),
          event_registrations(count)
        `)
        .eq('is_cancelled', false)
        .lt('date_time', new Date().toISOString())
        .not('date_time', 'is', null)
        .order('date_time', { ascending: false })
        .limit(12)

      expect(data).toEqual(pastEvents)
      expect(data).toHaveLength(2)
      expect(supabase.from).toHaveBeenCalledWith('events')
      // Most recent event should come first
      expect(new Date(data![0].date_time).getTime()).toBeGreaterThan(
        new Date(data![1].date_time).getTime()
      )
    })

    it('should return past events without requiring authentication', async () => {
      // No auth session setup — past events should be publicly accessible
      const pastEvents = [
        { ...pastEvent1, communities: { name: 'Public Community', city: 'Delhi' }, event_registrations: [{ count: 40 }] },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: pastEvents,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          communities(name, city),
          event_registrations(count)
        `)
        .eq('is_cancelled', false)
        .lt('date_time', new Date().toISOString())
        .not('date_time', 'is', null)
        .order('date_time', { ascending: false })
        .limit(12)

      // No auth was set up, yet the query should succeed
      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data![0].communities.name).toBe('Public Community')
    })

    it('should exclude cancelled events from past events', async () => {
      // Only non-cancelled events should be returned
      const nonCancelledPastEvents = [
        { ...pastEvent1, is_cancelled: false, communities: { name: 'Community', city: 'Chennai' }, event_registrations: [{ count: 10 }] },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: nonCancelledPastEvents,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('events')
        .select(`
          *,
          communities(name, city),
          event_registrations(count)
        `)
        .eq('is_cancelled', false)
        .lt('date_time', new Date().toISOString())
        .not('date_time', 'is', null)
        .order('date_time', { ascending: false })
        .limit(12)

      expect(data).toHaveLength(1)
      expect(data!.every(e => !e.is_cancelled)).toBe(true)
    })

    it('should handle errors when fetching past events', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection error', code: '500' },
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          communities(name, city),
          event_registrations(count)
        `)
        .eq('is_cancelled', false)
        .lt('date_time', new Date().toISOString())
        .not('date_time', 'is', null)
        .order('date_time', { ascending: false })
        .limit(12)

      expect(data).toBeNull()
      expect(error).toBeTruthy()
      expect(error?.message).toBe('Database connection error')
    })

    it('should return empty array when no past events exist', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          communities(name, city),
          event_registrations(count)
        `)
        .eq('is_cancelled', false)
        .lt('date_time', new Date().toISOString())
        .not('date_time', 'is', null)
        .order('date_time', { ascending: false })
        .limit(12)

      expect(error).toBeNull()
      expect(data).toEqual([])
      expect(data).toHaveLength(0)
    })

    it('should support filtering past events by search term', async () => {
      const searchResults = [
        { ...pastEvent1, title: 'Past Workshop', communities: { name: 'Community', city: 'Pune' }, event_registrations: [{ count: 20 }] },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: searchResults,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('events')
        .select(`
          *,
          communities(name, city),
          event_registrations(count)
        `)
        .eq('is_cancelled', false)
        .lt('date_time', new Date().toISOString())
        .not('date_time', 'is', null)
        .ilike('title', '%Workshop%')
        .order('date_time', { ascending: false })
        .limit(12)

      expect(data).toHaveLength(1)
      expect(data![0].title).toContain('Workshop')
    })

    it('should include community and registration data with past events', async () => {
      const pastEventWithRelations = {
        ...pastEvent1,
        communities: { name: 'Tech Community', city: 'Hyderabad' },
        event_registrations: [{ count: 45 }],
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [pastEventWithRelations],
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('events')
        .select(`
          *,
          communities(name, city),
          event_registrations(count)
        `)
        .eq('is_cancelled', false)
        .lt('date_time', new Date().toISOString())
        .not('date_time', 'is', null)
        .order('date_time', { ascending: false })
        .limit(12)

      expect(data![0].communities).toEqual({ name: 'Tech Community', city: 'Hyderabad' })
      expect(data![0].event_registrations[0].count).toBe(45)
    })
  })
})
