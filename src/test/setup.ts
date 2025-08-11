import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()

  // Reset DOM
  document.body.innerHTML = ''

  // Reset localStorage and sessionStorage
  localStorage.clear()
  sessionStorage.clear()

  // Reset console methods to avoid noise in tests
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  // Restore all mocks after each test
  vi.restoreAllMocks()

  // Clean up any timers
  vi.clearAllTimers()
})

// Mock DOM APIs that are not available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
})

// Mock geolocation API
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
})

// Mock Supabase client with comprehensive API coverage
vi.mock('@/integrations/supabase/client', () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    csv: vi.fn().mockReturnThis(),
    geojson: vi.fn().mockReturnThis(),
    explain: vi.fn().mockReturnThis(),
    rollback: vi.fn().mockReturnThis(),
    returns: vi.fn().mockReturnThis(),
    then: vi.fn((callback) => Promise.resolve({ data: [], error: null }).then(callback)),
  }

  return {
    supabase: {
      auth: {
        signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        signInWithOAuth: vi.fn().mockResolvedValue({ data: { provider: 'google', url: 'https://example.com' }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        setSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
        onAuthStateChange: vi.fn(() => ({
          data: {
            subscription: {
              unsubscribe: vi.fn()
            }
          }
        })),
        admin: {
          listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
          createUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          deleteUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          updateUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        }
      },
      from: vi.fn(() => mockQueryBuilder),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: null, error: null }),
          download: vi.fn().mockResolvedValue({ data: null, error: null }),
          remove: vi.fn().mockResolvedValue({ data: null, error: null }),
          list: vi.fn().mockResolvedValue({ data: [], error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.jpg' } }),
          createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/signed' }, error: null }),
        }))
      },
      realtime: {
        channel: vi.fn(() => ({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
          unsubscribe: vi.fn().mockReturnThis(),
        }))
      },
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn().mockReturnThis(),
      })),
      removeChannel: vi.fn()
    }
  }
})

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    systemTheme: 'light',
    themes: ['light', 'dark'],
    resolvedTheme: 'light',
  }),
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default'
    }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
    MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
    Link: vi.fn(({ children, to, ...props }: any) => children),
    NavLink: vi.fn(({ children, to, ...props }: any) => children),
  }
})

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: undefined,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    })),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
      reset: vi.fn(),
    })),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
      removeQueries: vi.fn(),
      clear: vi.fn(),
    })),
    QueryClient: vi.fn().mockImplementation(() => ({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
      removeQueries: vi.fn(),
      clear: vi.fn(),
    })),
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  }
})

// Mock date-fns
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns')
  return {
    ...actual,
    format: vi.fn((date, formatStr) => {
      if (formatStr === 'PPP') return 'January 1st, 2024'
      if (formatStr === 'p') return '12:00 PM'
      return '2024-01-01'
    }),
    formatDistance: vi.fn(() => 'about 1 hour'),
    isAfter: vi.fn(() => false),
    isBefore: vi.fn(() => true),
    addDays: vi.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
    subDays: vi.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  }
})

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const MockIcon = vi.fn((props: any) => props.children || null)

  return new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return MockIcon
      }
      return target[prop as keyof typeof target]
    }
  })
})

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: vi.fn((props: any) => props.children || null),
}))

// Global test utilities
global.ResizeObserver = window.ResizeObserver
global.IntersectionObserver = window.IntersectionObserver