import { describe, it, beforeEach, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { supabase } from '@/integrations/supabase/client'

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton when loading', () => {
    // Mock loading state
    vi.mocked(supabase.auth.getSession).mockImplementation(() =>
      new Promise(() => {}) // Never resolves to keep loading state
    )

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    // Check if skeleton loading is rendered (ProtectedRoute uses Skeleton components when loading)
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

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

    // Should not render the protected content when redirecting
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  it('renders children when user is authenticated', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockSession = { user: mockUser, access_token: 'token' }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null,
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(await screen.findByTestId('protected-content')).toBeInTheDocument()
  })
})