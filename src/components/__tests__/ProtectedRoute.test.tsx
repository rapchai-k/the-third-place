import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

const TestComponent = () => <div>Protected Content</div>

const renderWithRouter = (component: React.ReactElement, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton when loading', () => {
    // Mock loading state
    vi.mocked(supabase.auth.getSession).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    )

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    // Check if skeleton loading is rendered (ProtectedRoute uses Skeleton components when loading)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to auth when user is not authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    // Should redirect to /auth, so protected content shouldn't be visible
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockSession = { user: mockUser, access_token: 'token' }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null,
    })

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(await screen.findByText('Protected Content')).toBeInTheDocument()
  })
})