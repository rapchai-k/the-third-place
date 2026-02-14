/**
 * Centralized query key definitions for React Query
 * This ensures consistent query keys across the application and
 * makes invalidation and caching more predictable.
 */

export const queryKeys = {
  // User-related keys
  user: {
    profile: (userId: string | undefined) => ['user-profile', userId] as const,
    registrations: (userId: string | undefined) => ['user-registrations', userId] as const,
    memberships: (userId: string | undefined) => ['user-memberships', userId] as const,
    events: (userId: string | undefined) => ['user-events', userId] as const,
    communities: (userId: string | undefined) => ['user-communities', userId] as const,
  },

  // Event-related keys
  events: {
    all: ['events'] as const,
    list: (searchTerm?: string, tag?: string, city?: string) =>
      ['events', searchTerm, tag, city] as const,
    detail: (eventId: string) => ['event', eventId] as const,
    featured: () => ['featured-events'] as const,
    registration: (eventId: string, userId?: string) =>
      ['event-registration', eventId, userId] as const,
    pendingPayment: (eventId: string, userId?: string) =>
      ['pending-payment', eventId, userId] as const,
  },

  // Community-related keys
  communities: {
    all: ['communities'] as const,
    list: () => ['communities'] as const,
    detail: (communityId: string) => ['community', communityId] as const,
    featured: () => ['featured-communities'] as const,
    forFilter: () => ['communities-for-filter'] as const,
    membership: (communityId: string, userId: string) =>
      ['community-membership', communityId, userId] as const,
  },

  // Discussion-related keys
  discussions: {
    list: (communityFilter?: string | null, statusFilter?: string, searchTerm?: string) =>
      ['discussions', communityFilter, statusFilter, searchTerm] as const,
    detail: (discussionId: string) => ['discussion', discussionId] as const,
    comments: (discussionId: string) => ['discussion-comments', discussionId] as const,
  },

  // Payment-related keys
  payment: {
    verification: (sessionId: string | null) => ['payment-verification', sessionId] as const,
    history: (userId: string | undefined) => ['payment-history', userId] as const,
  },

  // Referral-related keys
  referrals: {
    stats: (userId: string) => ['referral-stats', userId] as const,
    activity: (userId: string) => ['referral-activity', userId] as const,
  },

  // Email-related keys
  email: {
    welcomeStatus: (userId: string | undefined) => ['welcome-email-status', userId] as const,
  },

  // Misc keys
  cities: () => ['event-cities'] as const,
} as const;

export type QueryKeys = typeof queryKeys;

