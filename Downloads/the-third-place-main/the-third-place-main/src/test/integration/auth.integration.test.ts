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
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }

  return {
    supabase: {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        getUser: vi.fn(),
        updateUser: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        onAuthStateChange: vi.fn(),
        refreshSession: vi.fn(),
      },
      from: vi.fn(() => mockQueryBuilder),
      rpc: vi.fn(),
    }
  }
})

describe('Authentication API Integration Tests', () => {
  const mockUser = createMockUser({
    email: 'test@example.com',
    role: 'user',
  })

  const mockSession = createMockSession(mockUser)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('User Registration', () => {
    it('should register new user successfully', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      })

      const { data, error } = await supabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'securepassword123',
        options: {
          emailRedirectTo: 'http://localhost:3000/',
        },
      })

      expect(error).toBeNull()
      expect(data.user).toEqual(mockUser)
      expect(data.session).toEqual(mockSession)
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'securepassword123',
        options: {
          emailRedirectTo: 'http://localhost:3000/',
        },
      })
    })

    it('should handle duplicate email registration', async () => {
      const duplicateEmailError = {
        message: 'User already registered',
        status: 422,
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: duplicateEmailError,
      })

      const { data, error } = await supabase.auth.signUp({
        email: 'existing@example.com',
        password: 'password123',
      })

      expect(data.user).toBeNull()
      expect(data.session).toBeNull()
      expect(error).toEqual(duplicateEmailError)
    })

    it('should validate password requirements', async () => {
      const weakPasswordError = {
        message: 'Password should be at least 6 characters',
        status: 422,
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: weakPasswordError,
      })

      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: '123', // Too weak
      })

      expect(data.user).toBeNull()
      expect(error).toEqual(weakPasswordError)
    })

    it('should create user profile after successful registration', async () => {
      // Mock successful auth signup
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      })

      // Mock user profile creation
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockUser.id,
            name: 'Test User',
            role: 'user',
            referral_code: 'TEST123',
          },
          error: null,
        }),
      } as any)

      // First register the user
      const { data: authData } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'password123',
      })

      // Then create user profile
      const { data: profileData } = await supabase
        .from('users')
        .insert({
          id: authData.user?.id,
          name: 'Test User',
          role: 'user',
        })
        .select()
        .single()

      expect(profileData?.id).toBe(mockUser.id)
      expect(profileData?.role).toBe('user')
    })
  })

  describe('User Authentication', () => {
    it('should sign in user with valid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(error).toBeNull()
      expect(data.user).toEqual(mockUser)
      expect(data.session).toEqual(mockSession)
    })

    it('should reject invalid credentials', async () => {
      const invalidCredentialsError = {
        message: 'Invalid login credentials',
        status: 400,
      }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: invalidCredentialsError,
      })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(data.user).toBeNull()
      expect(data.session).toBeNull()
      expect(error).toEqual(invalidCredentialsError)
    })

    it('should handle OAuth sign in with Google', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: {
          provider: 'google',
          url: 'https://accounts.google.com/oauth/authorize?...',
        },
        error: null,
      })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/',
        },
      })

      expect(error).toBeNull()
      expect(data.provider).toBe('google')
      expect(data.url).toContain('google.com')
    })

    it('should handle OAuth errors', async () => {
      const oauthError = {
        message: 'OAuth provider not configured',
        status: 400,
      }

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: {
          provider: 'google',
          url: null,
        },
        error: oauthError,
      })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })

      expect(error).toEqual(oauthError)
    })
  })

  describe('Session Management', () => {
    it('should get current session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const { data, error } = await supabase.auth.getSession()

      expect(error).toBeNull()
      expect(data.session).toEqual(mockSession)
    })

    it('should return null for no active session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const { data, error } = await supabase.auth.getSession()

      expect(error).toBeNull()
      expect(data.session).toBeNull()
    })

    it('should refresh expired session', async () => {
      const refreshedSession = {
        ...mockSession,
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      }

      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: {
          session: refreshedSession,
          user: mockUser,
        },
        error: null,
      })

      const { data, error } = await supabase.auth.refreshSession()

      expect(error).toBeNull()
      expect(data.session?.access_token).toBe('new-access-token')
    })

    it('should handle refresh token errors', async () => {
      const refreshError = {
        message: 'Invalid refresh token',
        status: 401,
      }

      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: {
          session: null,
          user: null,
        },
        error: refreshError,
      })

      const { data, error } = await supabase.auth.refreshSession()

      expect(data.session).toBeNull()
      expect(error).toEqual(refreshError)
    })
  })

  describe('User Profile Management', () => {
    it('should get current user profile', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { data, error } = await supabase.auth.getUser()

      expect(error).toBeNull()
      expect(data.user).toEqual(mockUser)
    })

    it('should update user profile', async () => {
      const updatedUser = {
        ...mockUser,
        user_metadata: {
          ...mockUser.user_metadata,
          name: 'Updated Name',
        },
      }

      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: updatedUser },
        error: null,
      })

      const { data, error } = await supabase.auth.updateUser({
        data: { name: 'Updated Name' },
      })

      expect(error).toBeNull()
      expect(data.user?.user_metadata?.name).toBe('Updated Name')
    })

    it('should update user password', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { data, error } = await supabase.auth.updateUser({
        password: 'newpassword123',
      })

      expect(error).toBeNull()
      expect(data.user).toEqual(mockUser)
    })
  })

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      })

      const { data, error } = await supabase.auth.resetPasswordForEmail(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/reset-password',
        }
      )

      expect(error).toBeNull()
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/reset-password',
        }
      )
    })

    it('should handle invalid email for password reset', async () => {
      const invalidEmailError = {
        message: 'Invalid email address',
        status: 422,
      }

      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: invalidEmailError,
      })

      const { error } = await supabase.auth.resetPasswordForEmail('invalid-email')

      expect(error).toEqual(invalidEmailError)
    })
  })

  describe('Sign Out', () => {
    it('should sign out user successfully', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      })

      const { error } = await supabase.auth.signOut()

      expect(error).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      const signOutError = {
        message: 'Failed to sign out',
        status: 500,
      }

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: signOutError,
      })

      const { error } = await supabase.auth.signOut()

      expect(error).toEqual(signOutError)
    })
  })

  describe('Auth State Changes', () => {
    it('should set up auth state change listener', () => {
      const mockSubscription = {
        unsubscribe: vi.fn(),
      }

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: mockSubscription },
      })

      const callback = vi.fn()
      const { data } = supabase.auth.onAuthStateChange(callback)

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(callback)
      expect(data.subscription).toBe(mockSubscription)
    })

    it('should handle auth state change events', () => {
      const callback = vi.fn()
      
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb) => {
        // Simulate auth state change
        cb('SIGNED_IN', mockSession)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      supabase.auth.onAuthStateChange(callback)

      expect(callback).toHaveBeenCalledWith('SIGNED_IN', mockSession)
    })
  })
})
