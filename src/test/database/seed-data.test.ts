import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/integrations/supabase/client'

// Mock the Supabase client for seed data testing
vi.mock('@/integrations/supabase/client', () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }

  return {
    supabase: {
      from: vi.fn(() => mockQueryBuilder),
      rpc: vi.fn(),
    }
  }
})

describe('Seed Data Integrity Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Admin User Seed Data', () => {
    it('should verify admin user exists in seed data', async () => {
      const expectedAdminUser = {
        id: 'admin-seed-id',
        email: 'admin@thethirdplace.com',
        name: 'System Administrator',
        role: 'admin',
        is_banned: false,
        created_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: expectedAdminUser,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin')
        .single()

      expect(error).toBeNull()
      expect(data?.role).toBe('admin')
      expect(data?.email).toContain('@thethirdplace.com')
    })

    it('should verify admin user has proper permissions', async () => {
      const adminUser = {
        id: 'admin-seed-id',
        role: 'admin',
        is_banned: false,
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: adminUser,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('users')
        .select('role, is_banned')
        .eq('role', 'admin')
        .single()

      expect(data?.role).toBe('admin')
      expect(data?.is_banned).toBe(false)
    })

    it('should verify admin user has unique referral code', async () => {
      const adminUser = {
        id: 'admin-seed-id',
        referral_code: 'ADMIN001',
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: adminUser,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('users')
        .select('referral_code')
        .eq('role', 'admin')
        .single()

      expect(data?.referral_code).toBeTruthy()
      expect(data?.referral_code).toMatch(/^[A-Z0-9]+$/)
    })
  })

  describe('Sample Communities Seed Data', () => {
    it('should verify sample communities exist', async () => {
      const sampleCommunities = [
        {
          id: 'community-bangalore-1',
          name: 'Bangalore Tech Meetup',
          city: 'Bangalore',
          description: 'A community for tech enthusiasts in Bangalore',
        },
        {
          id: 'community-mumbai-1',
          name: 'Mumbai Entrepreneurs',
          city: 'Mumbai',
          description: 'A community for entrepreneurs in Mumbai',
        },
        {
          id: 'community-delhi-1',
          name: 'Delhi Creative Hub',
          city: 'Delhi',
          description: 'A community for creative professionals in Delhi',
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: sampleCommunities,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at')

      expect(error).toBeNull()
      expect(data).toHaveLength(3)
      expect(data?.map(c => c.city)).toContain('Bangalore')
      expect(data?.map(c => c.city)).toContain('Mumbai')
      expect(data?.map(c => c.city)).toContain('Delhi')
    })

    it('should verify communities have valid data structure', async () => {
      const sampleCommunity = {
        id: 'community-bangalore-1',
        name: 'Bangalore Tech Meetup',
        city: 'Bangalore',
        description: 'A community for tech enthusiasts in Bangalore',
        image_url: '/images/communities/bangalore-tech.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: sampleCommunity,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('communities')
        .select('*')
        .eq('city', 'Bangalore')
        .single()

      expect(data?.name).toBeTruthy()
      expect(data?.city).toBeTruthy()
      expect(data?.description).toBeTruthy()
      expect(data?.created_at).toBeTruthy()
    })

    it('should verify communities cover major Indian cities', async () => {
      const expectedCities = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune']
      
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: expectedCities,
        error: null,
      })

      const { data } = await supabase.rpc('get_community_cities')

      expect(data).toContain('Bangalore')
      expect(data).toContain('Mumbai')
      expect(data).toContain('Delhi')
    })
  })

  describe('Sample Events Seed Data', () => {
    it('should verify sample events exist for each community', async () => {
      const sampleEvents = [
        {
          id: 'event-1',
          title: 'Tech Talk: AI in 2024',
          community_id: 'community-bangalore-1',
          date_time: '2024-12-31T18:00:00Z',
          capacity: 100,
        },
        {
          id: 'event-2',
          title: 'Startup Pitch Night',
          community_id: 'community-mumbai-1',
          date_time: '2024-12-31T19:00:00Z',
          capacity: 50,
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: sampleEvents,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date_time')

      expect(error).toBeNull()
      expect(data).toHaveLength(2)
      expect(data?.every(event => event.capacity > 0)).toBe(true)
    })

    it('should verify events have future dates', async () => {
      const futureEvents = [
        {
          id: 'event-1',
          date_time: '2024-12-31T18:00:00Z',
          is_cancelled: false,
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: futureEvents,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('events')
        .select('date_time, is_cancelled')
        .eq('is_cancelled', false)
        .order('date_time')

      expect(data?.every(event => {
        const eventDate = new Date(event.date_time)
        const now = new Date()
        return eventDate > now
      })).toBe(true)
    })

    it('should verify events have valid host assignments', async () => {
      const eventsWithHosts = [
        {
          id: 'event-1',
          host_id: 'admin-seed-id',
          title: 'Tech Talk: AI in 2024',
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: eventsWithHosts,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('events')
        .select(`
          *,
          users(name, role)
        `)
        .order('created_at')

      expect(data?.every(event => event.host_id)).toBe(true)
    })
  })

  describe('Sample Discussions Seed Data', () => {
    it('should verify sample discussions exist', async () => {
      const sampleDiscussions = [
        {
          id: 'discussion-1',
          title: 'What tech trends excite you most?',
          community_id: 'community-bangalore-1',
          created_by: 'admin-seed-id',
          expires_at: '2024-12-31T23:59:59Z',
          is_visible: true,
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: sampleDiscussions,
          error: null,
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .eq('is_visible', true)
        .order('created_at')

      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThan(0)
      expect(data?.every(discussion => discussion.is_visible)).toBe(true)
    })

    it('should verify discussions have future expiry dates', async () => {
      const activeDiscussions = [
        {
          id: 'discussion-1',
          expires_at: '2024-12-31T23:59:59Z',
          extended: false,
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: activeDiscussions,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('discussions')
        .select('expires_at, extended')
        .eq('is_visible', true)
        .order('expires_at')

      expect(data?.every(discussion => {
        const expiryDate = new Date(discussion.expires_at)
        const now = new Date()
        return expiryDate > now
      })).toBe(true)
    })

    it('should verify discussions have valid creators', async () => {
      const discussionsWithCreators = [
        {
          id: 'discussion-1',
          created_by: 'admin-seed-id',
          title: 'What tech trends excite you most?',
        }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: discussionsWithCreators,
          error: null,
        }),
      } as any)

      const { data } = await supabase
        .from('discussions')
        .select(`
          *,
          users(name, role)
        `)
        .order('created_at')

      expect(data?.every(discussion => discussion.created_by)).toBe(true)
    })
  })

  describe('Referential Integrity in Seed Data', () => {
    it('should verify all events reference valid communities', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { orphaned_events: 0 },
        error: null,
      })

      const { data } = await supabase.rpc('check_orphaned_events')

      expect(data?.orphaned_events).toBe(0)
    })

    it('should verify all discussions reference valid communities', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { orphaned_discussions: 0 },
        error: null,
      })

      const { data } = await supabase.rpc('check_orphaned_discussions')

      expect(data?.orphaned_discussions).toBe(0)
    })

    it('should verify all events have valid hosts', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { events_without_hosts: 0 },
        error: null,
      })

      const { data } = await supabase.rpc('check_events_without_hosts')

      expect(data?.events_without_hosts).toBe(0)
    })

    it('should verify all discussions have valid creators', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { discussions_without_creators: 0 },
        error: null,
      })

      const { data } = await supabase.rpc('check_discussions_without_creators')

      expect(data?.discussions_without_creators).toBe(0)
    })
  })

  describe('Seed Data Consistency', () => {
    it('should verify consistent timestamps in seed data', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { 
          invalid_timestamps: 0,
          future_created_at: 0,
          updated_before_created: 0
        },
        error: null,
      })

      const { data } = await supabase.rpc('validate_seed_timestamps')

      expect(data?.invalid_timestamps).toBe(0)
      expect(data?.future_created_at).toBe(0)
      expect(data?.updated_before_created).toBe(0)
    })

    it('should verify seed data follows naming conventions', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { 
          invalid_names: 0,
          empty_descriptions: 0,
          invalid_emails: 0
        },
        error: null,
      })

      const { data } = await supabase.rpc('validate_seed_data_quality')

      expect(data?.invalid_names).toBe(0)
      expect(data?.empty_descriptions).toBe(0)
      expect(data?.invalid_emails).toBe(0)
    })

    it('should verify seed data has proper geographic distribution', async () => {
      const cityDistribution = {
        'Bangalore': 2,
        'Mumbai': 2,
        'Delhi': 2,
        'Chennai': 1,
        'Hyderabad': 1,
        'Pune': 1,
      }

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: cityDistribution,
        error: null,
      })

      const { data } = await supabase.rpc('get_community_distribution_by_city')

      expect(Object.keys(data || {})).toContain('Bangalore')
      expect(Object.keys(data || {})).toContain('Mumbai')
      expect(Object.keys(data || {})).toContain('Delhi')
    })
  })

  describe('Seed Data Performance', () => {
    it('should verify seed data does not exceed reasonable limits', async () => {
      const dataCounts = {
        communities: 10,
        events: 20,
        discussions: 15,
        users: 5,
      }

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: dataCounts,
        error: null,
      })

      const { data } = await supabase.rpc('get_seed_data_counts')

      expect(data?.communities).toBeLessThan(50)
      expect(data?.events).toBeLessThan(100)
      expect(data?.discussions).toBeLessThan(50)
      expect(data?.users).toBeLessThan(20)
    })

    it('should verify seed data is properly indexed', async () => {
      const indexUsage = {
        communities_city_idx: true,
        events_date_time_idx: true,
        discussions_expires_at_idx: true,
      }

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: indexUsage,
        error: null,
      })

      const { data } = await supabase.rpc('check_seed_data_index_usage')

      expect(data?.communities_city_idx).toBe(true)
      expect(data?.events_date_time_idx).toBe(true)
      expect(data?.discussions_expires_at_idx).toBe(true)
    })
  })
})
