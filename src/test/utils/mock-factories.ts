import { vi } from 'vitest'

// Factory for creating mock Supabase responses
export const createMockSupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
})

// Factory for creating mock Supabase query builders
export const createMockQueryBuilder = (mockData: any = [], mockError: any = null) => {
  const mockResponse = createMockSupabaseResponse(mockData, mockError)
  
  return {
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
    single: vi.fn().mockResolvedValue(mockResponse),
    maybeSingle: vi.fn().mockResolvedValue(mockResponse),
    csv: vi.fn().mockResolvedValue(mockResponse),
    geojson: vi.fn().mockResolvedValue(mockResponse),
    explain: vi.fn().mockResolvedValue(mockResponse),
    rollback: vi.fn().mockResolvedValue(mockResponse),
    returns: vi.fn().mockReturnThis(),
    then: vi.fn((callback) => Promise.resolve(mockResponse).then(callback)),
  }
}

// Factory for creating mock users with different roles
export const createMockUserFactory = () => {
  const baseUser = {
    id: 'user-id',
    email: 'user@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_metadata: {},
    app_metadata: {},
  }

  return {
    regularUser: (overrides = {}) => ({
      ...baseUser,
      id: 'regular-user-id',
      email: 'regular@example.com',
      user_metadata: { role: 'user' },
      ...overrides,
    }),

    adminUser: (overrides = {}) => ({
      ...baseUser,
      id: 'admin-user-id',
      email: 'admin@example.com',
      user_metadata: { role: 'admin' },
      ...overrides,
    }),

    bannedUser: (overrides = {}) => ({
      ...baseUser,
      id: 'banned-user-id',
      email: 'banned@example.com',
      user_metadata: { role: 'user', is_banned: true },
      ...overrides,
    }),

    customUser: (overrides = {}) => ({
      ...baseUser,
      ...overrides,
    }),
  }
}

// Factory for creating mock communities
export const createMockCommunityFactory = () => {
  const baseCommunity = {
    id: 'community-id',
    name: 'Test Community',
    description: 'A test community',
    city: 'Test City',
    image_url: '/test-community.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  return {
    activeCommunity: (overrides = {}) => ({
      ...baseCommunity,
      id: 'active-community-id',
      name: 'Active Community',
      description: 'An active test community',
      ...overrides,
    }),

    largeCommunity: (overrides = {}) => ({
      ...baseCommunity,
      id: 'large-community-id',
      name: 'Large Community',
      description: 'A large test community with many members',
      ...overrides,
    }),

    newCommunity: (overrides = {}) => ({
      ...baseCommunity,
      id: 'new-community-id',
      name: 'New Community',
      description: 'A newly created test community',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }),

    customCommunity: (overrides = {}) => ({
      ...baseCommunity,
      ...overrides,
    }),
  }
}

// Factory for creating mock events
export const createMockEventFactory = () => {
  const baseEvent = {
    id: 'event-id',
    community_id: 'community-id',
    title: 'Test Event',
    description: 'A test event',
    date_time: '2024-12-31T18:00:00Z',
    venue: 'Test Venue',
    capacity: 50,
    host_id: 'user-id',
    is_cancelled: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  return {
    upcomingEvent: (overrides = {}) => ({
      ...baseEvent,
      id: 'upcoming-event-id',
      title: 'Upcoming Event',
      date_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      ...overrides,
    }),

    pastEvent: (overrides = {}) => ({
      ...baseEvent,
      id: 'past-event-id',
      title: 'Past Event',
      date_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      ...overrides,
    }),

    cancelledEvent: (overrides = {}) => ({
      ...baseEvent,
      id: 'cancelled-event-id',
      title: 'Cancelled Event',
      is_cancelled: true,
      ...overrides,
    }),

    fullEvent: (overrides = {}) => ({
      ...baseEvent,
      id: 'full-event-id',
      title: 'Full Event',
      capacity: 1,
      ...overrides,
    }),

    customEvent: (overrides = {}) => ({
      ...baseEvent,
      ...overrides,
    }),
  }
}

// Factory for creating mock discussions
export const createMockDiscussionFactory = () => {
  const baseDiscussion = {
    id: 'discussion-id',
    community_id: 'community-id',
    title: 'Test Discussion',
    prompt: 'This is a test discussion prompt',
    created_by: 'user-id',
    expires_at: '2024-12-31T23:59:59Z',
    is_visible: true,
    extended: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  return {
    activeDiscussion: (overrides = {}) => ({
      ...baseDiscussion,
      id: 'active-discussion-id',
      title: 'Active Discussion',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      ...overrides,
    }),

    expiredDiscussion: (overrides = {}) => ({
      ...baseDiscussion,
      id: 'expired-discussion-id',
      title: 'Expired Discussion',
      expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      ...overrides,
    }),

    hiddenDiscussion: (overrides = {}) => ({
      ...baseDiscussion,
      id: 'hidden-discussion-id',
      title: 'Hidden Discussion',
      is_visible: false,
      ...overrides,
    }),

    extendedDiscussion: (overrides = {}) => ({
      ...baseDiscussion,
      id: 'extended-discussion-id',
      title: 'Extended Discussion',
      extended: true,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      ...overrides,
    }),

    customDiscussion: (overrides = {}) => ({
      ...baseDiscussion,
      ...overrides,
    }),
  }
}

// Factory for creating mock API responses with pagination
export const createMockPaginatedResponse = <T>(
  data: T[], 
  page = 1, 
  pageSize = 10, 
  total = data.length
) => {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = data.slice(startIndex, endIndex)

  return {
    data: paginatedData,
    error: null,
    count: total,
    status: 200,
    statusText: 'OK',
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: endIndex < total,
      hasPrev: page > 1,
    },
  }
}

// Export factory instances for easy use
export const mockUsers = createMockUserFactory()
export const mockCommunities = createMockCommunityFactory()
export const mockEvents = createMockEventFactory()
export const mockDiscussions = createMockDiscussionFactory()
