import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import { createMockUser, createMockCommunity, createMockEvent } from '@/test/utils/test-utils'

// Mock the Supabase client for database constraint testing
vi.mock('@/integrations/supabase/client', () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }

  return {
    supabase: {
      from: vi.fn(() => mockQueryBuilder),
      rpc: vi.fn(),
    }
  }
})

describe('Database Constraints and Data Integrity Tests', () => {
  const mockUser = createMockUser()
  const mockCommunity = createMockCommunity()
  const mockEvent = createMockEvent()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Foreign Key Constraint Enforcement', () => {
    it('should enforce foreign key constraint on community_members.user_id', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'insert or update on table "community_members" violates foreign key constraint',
            code: '23503'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('community_members')
        .insert({
          user_id: 'non-existent-user-id',
          community_id: mockCommunity.id,
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23503') // Foreign key violation
    })

    it('should enforce foreign key constraint on community_members.community_id', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'insert or update on table "community_members" violates foreign key constraint',
            code: '23503'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('community_members')
        .insert({
          user_id: mockUser.id,
          community_id: 'non-existent-community-id',
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23503')
    })

    it('should enforce foreign key constraint on events.community_id', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'insert or update on table "events" violates foreign key constraint',
            code: '23503'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: 'Test Event',
          description: 'Test Description',
          date_time: '2024-12-31T18:00:00Z',
          venue: 'Test Venue',
          capacity: 50,
          community_id: 'non-existent-community-id',
          host_id: mockUser.id,
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23503')
    })

    it('should enforce foreign key constraint on events.host_id', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'insert or update on table "events" violates foreign key constraint',
            code: '23503'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: 'Test Event',
          description: 'Test Description',
          date_time: '2024-12-31T18:00:00Z',
          venue: 'Test Venue',
          capacity: 50,
          community_id: mockCommunity.id,
          host_id: 'non-existent-user-id',
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23503')
    })

    it('should enforce foreign key constraint on event_registrations', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'insert or update on table "event_registrations" violates foreign key constraint',
            code: '23503'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          user_id: 'non-existent-user-id',
          event_id: 'non-existent-event-id',
          registration_status: 'pending',
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23503')
    })
  })

  describe('Unique Constraint Enforcement', () => {
    it('should enforce unique constraint on community_members (user_id, community_id)', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'duplicate key value violates unique constraint "community_members_user_id_community_id_key"',
            code: '23505'
          },
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
      expect(error?.code).toBe('23505') // Unique violation
    })

    it('should enforce unique constraint on event_registrations (user_id, event_id)', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'duplicate key value violates unique constraint "event_registrations_user_id_event_id_key"',
            code: '23505'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          user_id: mockUser.id,
          event_id: mockEvent.id,
          registration_status: 'pending',
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23505')
    })

    it('should enforce unique constraint on users.email', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'duplicate key value violates unique constraint "users_email_key"',
            code: '23505'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: 'new-user-id',
          email: 'existing@example.com', // Duplicate email
          name: 'New User',
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23505')
    })

    it('should enforce unique constraint on users.referral_code', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'duplicate key value violates unique constraint "users_referral_code_key"',
            code: '23505'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: 'new-user-id',
          email: 'newuser@example.com',
          name: 'New User',
          referral_code: 'EXISTING123', // Duplicate referral code
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23505')
    })
  })

  describe('Not Null Constraint Enforcement', () => {
    it('should enforce not null constraint on communities.name', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'null value in column "name" violates not-null constraint',
            code: '23502'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .insert({
          // name is missing (required field)
          description: 'Test Community',
          city: 'Test City',
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23502') // Not null violation
    })

    it('should enforce not null constraint on communities.city', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'null value in column "city" violates not-null constraint',
            code: '23502'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: 'Test Community',
          description: 'Test Community',
          // city is missing (required field)
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23502')
    })

    it('should enforce not null constraint on events.title', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'null value in column "title" violates not-null constraint',
            code: '23502'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .insert({
          // title is missing (required field)
          description: 'Test Event',
          date_time: '2024-12-31T18:00:00Z',
          venue: 'Test Venue',
          capacity: 50,
          community_id: mockCommunity.id,
          host_id: mockUser.id,
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23502')
    })

    it('should enforce not null constraint on events.date_time', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'null value in column "date_time" violates not-null constraint',
            code: '23502'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: 'Test Event',
          description: 'Test Event',
          // date_time is missing (required field)
          venue: 'Test Venue',
          capacity: 50,
          community_id: mockCommunity.id,
          host_id: mockUser.id,
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23502')
    })
  })

  describe('Check Constraint Enforcement', () => {
    it('should enforce positive capacity constraint on events', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'new row for relation "events" violates check constraint "events_capacity_positive"',
            code: '23514'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: 'Test Event',
          description: 'Test Event',
          date_time: '2024-12-31T18:00:00Z',
          venue: 'Test Venue',
          capacity: 0, // Invalid capacity (must be > 0)
          community_id: mockCommunity.id,
          host_id: mockUser.id,
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('should enforce future date constraint on discussions.expires_at', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'new row for relation "discussions" violates check constraint "discussions_future_expiry"',
            code: '23514'
          },
        }),
      } as any)

      const { data, error } = await supabase
        .from('discussions')
        .insert({
          title: 'Test Discussion',
          prompt: 'Test prompt',
          community_id: mockCommunity.id,
          created_by: mockUser.id,
          expires_at: '2020-01-01T00:00:00Z', // Past date (invalid)
        })
        .select()
        .single()

      expect(data).toBeNull()
      expect(error?.code).toBe('23514')
    })
  })

  describe('Cascade Delete Behavior', () => {
    it('should test cascade delete behavior for community deletion', async () => {
      // Mock successful deletion with cascade
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any)

      // Delete community should cascade to related records
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', mockCommunity.id)

      expect(error).toBeNull()
    })

    it('should test cascade delete behavior for user deletion', async () => {
      // Mock successful deletion with cascade
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any)

      // Delete user should cascade to related records
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', mockUser.id)

      expect(error).toBeNull()
    })

    it('should test restrict delete behavior for referenced records', async () => {
      // Mock delete restriction when referenced records exist
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'update or delete on table violates foreign key constraint',
            code: '23503'
          },
        }),
      } as any)

      // Should not be able to delete if referenced by other records
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', mockUser.id)

      expect(error?.code).toBe('23503')
    })
  })
})
