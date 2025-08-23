import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWelcomeEmail } from '../useWelcomeEmail';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/integrations/supabase/client');
vi.mock('@/hooks/use-toast');

const mockUseAuth = vi.mocked(useAuth);
const mockSupabase = vi.mocked(supabase);

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useWelcomeEmail Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Welcome Email Status Query', () => {
    it('should fetch welcome email status for authenticated user', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' }
      };

      const mockSession = {
        access_token: 'test-token',
        user: mockUser
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signInWithGoogle: vi.fn(),
        signOut: vi.fn(),
      });

      // Mock Supabase query
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { welcome_email_sent_at: null },
              error: null
            })
          })
        })
      });

      mockSupabase.from = mockFrom;

      const { result } = renderHook(() => useWelcomeEmail(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(result.current.welcomeEmailStatus).toEqual({
        welcomeEmailSent: false,
        sentAt: null
      });
    });

    it('should not fetch status when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: false,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signInWithGoogle: vi.fn(),
        signOut: vi.fn(),
      });

      const { result } = renderHook(() => useWelcomeEmail(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.welcomeEmailStatus).toBeUndefined();
    });

    it('should handle query errors gracefully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' }
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'test-token', user: mockUser },
        loading: false,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signInWithGoogle: vi.fn(),
        signOut: vi.fn(),
      });

      // Mock Supabase query error
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      mockSupabase.from = mockFrom;

      const { result } = renderHook(() => useWelcomeEmail(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle error gracefully
      expect(result.current.welcomeEmailStatus).toBeUndefined();
    });
  });

  describe('Auto-trigger Welcome Email', () => {
    it('should auto-trigger welcome email for new user', async () => {
      const mockUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        user_metadata: { name: 'New User' }
      };

      const mockSession = {
        access_token: 'test-token',
        user: mockUser
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signInWithGoogle: vi.fn(),
        signOut: vi.fn(),
      });

      // Mock Supabase query - user hasn't received welcome email
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { welcome_email_sent_at: null },
              error: null
            })
          })
        })
      });

      // Mock Supabase functions invoke
      const mockFunctions = {
        invoke: vi.fn().mockResolvedValue({
          data: { success: true, messageId: 'test-message-id' },
          error: null
        })
      };

      mockSupabase.from = mockFrom;
      mockSupabase.functions = mockFunctions;

      const { result } = renderHook(() => useWelcomeEmail(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFunctions.invoke).toHaveBeenCalledWith('welcome-email-trigger', {
          body: {
            userId: 'new-user-id',
            userEmail: 'newuser@example.com',
            userName: 'New User'
          },
          headers: {
            Authorization: 'Bearer test-token'
          }
        });
      });
    });

    it('should not auto-trigger if welcome email already sent', async () => {
      const mockUser = {
        id: 'existing-user-id',
        email: 'existing@example.com',
        user_metadata: { name: 'Existing User' }
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'test-token', user: mockUser },
        loading: false,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signInWithGoogle: vi.fn(),
        signOut: vi.fn(),
      });

      // Mock Supabase query - user already received welcome email
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { welcome_email_sent_at: '2025-01-01T00:00:00Z' },
              error: null
            })
          })
        })
      });

      const mockFunctions = {
        invoke: vi.fn()
      };

      mockSupabase.from = mockFrom;
      mockSupabase.functions = mockFunctions;

      const { result } = renderHook(() => useWelcomeEmail(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.welcomeEmailStatus?.welcomeEmailSent).toBe(true);
      });

      // Should not trigger welcome email
      expect(mockFunctions.invoke).not.toHaveBeenCalled();
    });

    it('should handle missing user name gracefully', async () => {
      const mockUser = {
        id: 'user-no-name',
        email: 'noname@example.com',
        user_metadata: {} // No name provided
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'test-token', user: mockUser },
        loading: false,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signInWithGoogle: vi.fn(),
        signOut: vi.fn(),
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { welcome_email_sent_at: null },
              error: null
            })
          })
        })
      });

      const mockFunctions = {
        invoke: vi.fn().mockResolvedValue({
          data: { success: true },
          error: null
        })
      };

      mockSupabase.from = mockFrom;
      mockSupabase.functions = mockFunctions;

      const { result } = renderHook(() => useWelcomeEmail(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFunctions.invoke).toHaveBeenCalledWith('welcome-email-trigger', {
          body: {
            userId: 'user-no-name',
            userEmail: 'noname@example.com',
            userName: 'noname' // Should default to email prefix
          },
          headers: {
            Authorization: 'Bearer test-token'
          }
        });
      });
    });
  });

  describe('Manual Trigger Function', () => {
    it('should allow manual triggering of welcome email', async () => {
      const mockUser = {
        id: 'manual-user-id',
        email: 'manual@example.com',
        user_metadata: { name: 'Manual User' }
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'test-token', user: mockUser },
        loading: false,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signInWithGoogle: vi.fn(),
        signOut: vi.fn(),
      });

      const mockFunctions = {
        invoke: vi.fn().mockResolvedValue({
          data: { success: true, messageId: 'manual-message-id' },
          error: null
        })
      };

      mockSupabase.functions = mockFunctions;

      const { result } = renderHook(() => useWelcomeEmail(), {
        wrapper: createWrapper(),
      });

      // Manually trigger welcome email
      await result.current.triggerWelcomeEmail();

      expect(mockFunctions.invoke).toHaveBeenCalledWith('welcome-email-trigger', {
        body: {
          userId: 'manual-user-id',
          userEmail: 'manual@example.com',
          userName: 'Manual User'
        },
        headers: {
          Authorization: 'Bearer test-token'
        }
      });
    });

    it('should handle manual trigger errors', async () => {
      const mockUser = {
        id: 'error-user-id',
        email: 'error@example.com',
        user_metadata: { name: 'Error User' }
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'test-token', user: mockUser },
        loading: false,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signInWithGoogle: vi.fn(),
        signOut: vi.fn(),
      });

      const mockFunctions = {
        invoke: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Function error' }
        })
      };

      mockSupabase.functions = mockFunctions;

      const { result } = renderHook(() => useWelcomeEmail(), {
        wrapper: createWrapper(),
      });

      await result.current.triggerWelcomeEmail();

      expect(result.current.triggerError).toBeTruthy();
    });
  });
});
