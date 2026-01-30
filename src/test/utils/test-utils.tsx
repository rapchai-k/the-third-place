import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { TooltipProvider } from '@/components/ui/tooltip'

// Custom render function that includes all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Query client options
  queryClient?: QueryClient

  // Provider options
  withAuth?: boolean
  withTheme?: boolean
  withTooltip?: boolean
}

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    queryClient = createTestQueryClient(),
    withAuth = true,
    withTheme = true,
    withTooltip = true,
    ...renderOptions
  } = options

  function Wrapper({ children }: { children: React.ReactNode }) {
    let content = children

    // Wrap with QueryClient
    content = (
      <QueryClientProvider client={queryClient}>
        {content}
      </QueryClientProvider>
    )

    // Wrap with Theme Provider
    if (withTheme) {
      content = <ThemeProvider>{content}</ThemeProvider>
    }

    // Wrap with Auth Provider
    if (withAuth) {
      content = <AuthProvider>{content}</AuthProvider>
    }

    // Wrap with Tooltip Provider
    if (withTooltip) {
      content = <TooltipProvider>{content}</TooltipProvider>
    }

    return <>{content}</>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Specialized render functions for common scenarios
export function renderWithAuth(ui: React.ReactElement, options?: CustomRenderOptions) {
  return renderWithProviders(ui, {
    withTheme: false,
    withTooltip: false,
    ...options
  })
}

export function renderWithQuery(ui: React.ReactElement, options?: CustomRenderOptions) {
  return renderWithProviders(ui, {
    withAuth: false,
    withTheme: false,
    withTooltip: false,
    ...options
  })
}

// Helper to create a mock user for testing
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_metadata: {},
  app_metadata: {},
  ...overrides,
})

// Helper to create a mock session for testing
export const createMockSession = (userOverrides = {}) => ({
  user: createMockUser(userOverrides),
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  refresh_token: 'mock-refresh-token',
})

// Helper to create mock community data
export const createMockCommunity = (overrides = {}) => ({
  id: 'test-community-id',
  name: 'Test Community',
  description: 'A test community for testing',
  city: 'Test City',
  image_url: '/test-image.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Helper to create mock event data
export const createMockEvent = (overrides = {}) => ({
  id: 'test-event-id',
  community_id: 'test-community-id',
  title: 'Test Event',
  description: 'A test event for testing',
  date_time: '2024-12-31T18:00:00Z',
  venue: 'Test Venue',
  capacity: 50,
  host_id: 'test-user-id',
  is_cancelled: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Helper to create mock discussion data
export const createMockDiscussion = (overrides = {}) => ({
  id: 'test-discussion-id',
  community_id: 'test-community-id',
  title: 'Test Discussion',
  prompt: 'This is a test discussion prompt',
  created_by: 'test-user-id',
  expires_at: '2024-12-31T23:59:59Z',
  is_visible: true,
  extended: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Helper to wait for async operations in tests
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
