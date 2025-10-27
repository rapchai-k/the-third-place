import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { supabase } from '@/integrations/supabase/client'

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

describe('ProtectedRoute Enhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading States', () => {
    it('shows loading skeleton when authentication is loading', () => {
      // Mock loading state by never resolving getSession
      vi.mocked(supabase.auth.getSession).mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      )

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      // Should show skeleton loading components
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()

      // Check for skeleton elements
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('shows loading skeleton with correct structure', () => {
      vi.mocked(supabase.auth.getSession).mockImplementation(() =>
        new Promise(() => {})
      )

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      // Check for specific skeleton structure
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument()
      expect(document.querySelector('.max-w-md')).toBeInTheDocument()
      expect(document.querySelector('.space-y-4')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated States', () => {
    it('redirects to auth when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      })
    })

    it('handles auth errors gracefully', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Auth error' } as any,
      })

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Authenticated States', () => {
    it('renders children when user is authenticated', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
      const mockSession = {
        user: mockUser,
        access_token: 'token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        refresh_token: 'refresh'
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null,
      })

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })
    })

    it('renders children for authenticated users regardless of role', async () => {
      const regularUser = {
        id: '456',
        email: 'user@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        user_metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
      const userSession = {
        user: regularUser,
        access_token: 'user-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        refresh_token: 'user-refresh'
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: userSession as any },
        error: null,
      })

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })
    })
  })

  describe('State Transitions', () => {
    it('transitions from loading to authenticated', async () => {
      let resolveSession: (value: any) => void
      const sessionPromise = new Promise((resolve) => {
        resolveSession = resolve
      })

      vi.mocked(supabase.auth.getSession).mockReturnValue(sessionPromise as any)

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      // Initially loading
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()

      // Resolve with authenticated user
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token' }
      resolveSession!({
        data: { session: mockSession },
        error: null,
      })

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })
    })

    it('transitions from loading to unauthenticated', async () => {
      let resolveSession: (value: any) => void
      const sessionPromise = new Promise((resolve) => {
        resolveSession = resolve
      })

      vi.mocked(supabase.auth.getSession).mockReturnValue(sessionPromise as any)

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      // Initially loading
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()

      // Resolve with no user
      resolveSession!({
        data: { session: null },
        error: null,
      })

      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles malformed session data', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: null } as any },
        error: null,
      })

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      })
    })

    it('handles network errors during auth check', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(supabase.auth.getSession).mockRejectedValue(
        new Error('Network error')
      )

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })
})
