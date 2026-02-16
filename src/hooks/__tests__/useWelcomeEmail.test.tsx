import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWelcomeEmail } from '../useWelcomeEmail';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';

vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/use-toast');
vi.mock('@/utils/supabaseWithTimeout', () => ({
  invokeWithTimeoutRace: vi.fn(),
  TIMEOUT_VALUES: { NORMAL: 10000 },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);

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

describe('useWelcomeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
      data: undefined,
    } as any);
  });

  it('configures welcome email status query for authenticated user', () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      user_metadata: { name: 'Test User' },
    } as any;

    mockUseAuth.mockReturnValue({
      user,
      session: { access_token: 'token', user } as any,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });

    renderHook(() => useWelcomeEmail(), { wrapper: createWrapper() });

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['welcomeEmailStatus', 'user-1'],
        enabled: true,
      })
    );
  });

  it('disables welcome email status query for unauthenticated user', () => {
    renderHook(() => useWelcomeEmail(), { wrapper: createWrapper() });

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['welcomeEmailStatus', undefined],
        enabled: false,
      })
    );
  });

  it('auto-triggers welcome email when user is present and not yet sent', async () => {
    const mutateSpy = vi.fn();
    const user = {
      id: 'new-user-id',
      email: 'new@example.com',
      user_metadata: { name: 'New User' },
    } as any;

    mockUseAuth.mockReturnValue({
      user,
      session: { access_token: 'token', user } as any,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: { welcomeEmailSent: false, sentAt: null },
      isLoading: false,
    } as any);

    mockUseMutation.mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useWelcomeEmail(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith({
        userId: 'new-user-id',
        userEmail: 'new@example.com',
        userName: 'New User',
      });
    });
  });

  it('does not auto-trigger if welcome email already sent', () => {
    const mutateSpy = vi.fn();
    const user = {
      id: 'existing-user-id',
      email: 'existing@example.com',
      user_metadata: { name: 'Existing User' },
    } as any;

    mockUseAuth.mockReturnValue({
      user,
      session: { access_token: 'token', user } as any,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: { welcomeEmailSent: true, sentAt: '2025-01-01T00:00:00Z' },
      isLoading: false,
    } as any);

    mockUseMutation.mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useWelcomeEmail(), { wrapper: createWrapper() });

    expect(mutateSpy).not.toHaveBeenCalled();
  });

  it('manual trigger uses fallback name from email prefix when user metadata is missing', async () => {
    const mutateSpy = vi.fn();
    const user = {
      id: 'user-no-name',
      email: 'noname@example.com',
      user_metadata: {},
    } as any;

    mockUseAuth.mockReturnValue({
      user,
      session: { access_token: 'token', user } as any,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: { welcomeEmailSent: true, sentAt: '2025-01-01T00:00:00Z' },
      isLoading: false,
    } as any);

    mockUseMutation.mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
      error: null,
      data: undefined,
    } as any);

    const { result } = renderHook(() => useWelcomeEmail(), { wrapper: createWrapper() });
    await result.current.triggerWelcomeEmail();

    expect(mutateSpy).toHaveBeenCalledWith({
      userId: 'user-no-name',
      userEmail: 'noname@example.com',
      userName: 'noname',
    });
  });
});
