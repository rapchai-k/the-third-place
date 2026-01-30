/**
 * GA4/GTM Analytics Utility
 *
 * Core analytics utility for tracking events via Google Tag Manager.
 * All events are pushed to the dataLayer and processed by GTM.
 *
 * @see docs/GA4_GTM_IMPLEMENTATION_PLAN.md for full implementation details
 */

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// Debug mode - enable console logging in development
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Log analytics events to console in development mode
 */
function debugLog(eventName: string, params?: Record<string, unknown>): void {
  if (DEBUG) {
    console.log(`[Analytics] ${eventName}`, params || '');
  }
}

/**
 * Push event to GTM dataLayer
 */
function pushToDataLayer(data: Record<string, unknown>): void {
  if (typeof window === 'undefined') {
    return; // SSR guard
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

/**
 * Core analytics object with tracking methods
 */
export const analytics = {
  /**
   * Track page view
   * @param params - Page view parameters
   *
   * Note: Uses 'tp_page_view' event name to prevent collision with GA4's built-in page_view.
   * GTM will convert this to 'page_view' when forwarding to GA4.
   */
  pageView(params?: {
    page_path?: string;
    page_title?: string;
    page_location?: string;
    content_type?: string;
    content_id?: string;
  }): void {
    const eventParams = {
      event: 'tp_page_view', // Custom event name for GTM routing
      page_path: params?.page_path || (typeof window !== 'undefined' ? window.location.pathname : ''),
      page_title: params?.page_title || (typeof document !== 'undefined' ? document.title : ''),
      page_location: params?.page_location || (typeof window !== 'undefined' ? window.location.href : ''),
      ...(params?.content_type && { content_type: params.content_type }),
      ...(params?.content_id && { content_id: params.content_id }),
    };

    debugLog('tp_page_view', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track custom event
   * @param eventName - Name of the event
   * @param params - Event parameters
   */
  event(eventName: string, params?: Record<string, unknown>): void {
    const eventParams = {
      event: eventName,
      ...params,
    };

    debugLog(eventName, eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track user login
   * @param method - Authentication method (email, google, etc.)
   * @param userId - Optional user ID
   */
  login(method: string, userId?: string): void {
    const eventParams = {
      event: 'login',
      method,
      ...(userId && { user_id: userId }),
    };

    debugLog('login', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track user sign up
   * @param method - Registration method (email, google, etc.)
   * @param userId - Optional user ID
   */
  signUp(method: string, userId?: string): void {
    const eventParams = {
      event: 'sign_up',
      method,
      ...(userId && { user_id: userId }),
    };

    debugLog('sign_up', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Set user properties for GA4
   * @param userId - User ID
   * @param properties - Additional user properties
   */
  setUser(userId: string, properties?: Record<string, unknown>): void {
    const eventParams = {
      event: 'set_user_properties',
      user_id: userId,
      user_properties: properties || {},
    };

    debugLog('set_user_properties', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Clear user data (on logout)
   */
  clearUser(): void {
    const eventParams = {
      event: 'clear_user_properties',
      user_id: null,
      user_properties: null,
    };

    debugLog('clear_user_properties', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track e-commerce: view item (event detail page)
   * @param params - Item view parameters
   */
  viewItem(params: {
    item_id: string;
    item_name: string;
    price: number;
    currency?: string;
    item_category?: string;
    item_category2?: string;
  }): void {
    const eventParams = {
      event: 'view_item',
      currency: params.currency || 'INR',
      value: params.price,
      items: [
        {
          item_id: params.item_id,
          item_name: params.item_name,
          price: params.price,
          ...(params.item_category && { item_category: params.item_category }),
          ...(params.item_category2 && { item_category2: params.item_category2 }),
        },
      ],
    };

    debugLog('view_item', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track e-commerce: begin checkout (payment initiation)
   * @param params - Checkout parameters
   */
  beginCheckout(params: {
    transaction_id?: string;
    value: number;
    currency?: string;
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity?: number;
    }>;
  }): void {
    const eventParams = {
      event: 'begin_checkout',
      currency: params.currency || 'INR',
      value: params.value,
      ...(params.transaction_id && { transaction_id: params.transaction_id }),
      items: params.items,
    };

    debugLog('begin_checkout', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track e-commerce: purchase (successful payment)
   * @param params - Purchase parameters
   */
  purchase(params: {
    transaction_id: string;
    value: number;
    currency?: string;
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity?: number;
    }>;
  }): void {
    const eventParams = {
      event: 'purchase',
      transaction_id: params.transaction_id,
      currency: params.currency || 'INR',
      value: params.value,
      items: params.items,
    };

    debugLog('purchase', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track e-commerce: refund (registration cancellation)
   * @param params - Refund parameters
   */
  refund(params: {
    transaction_id: string;
    value: number;
    currency?: string;
    reason?: string;
  }): void {
    const eventParams = {
      event: 'refund',
      transaction_id: params.transaction_id,
      currency: params.currency || 'INR',
      value: params.value,
      ...(params.reason && { reason: params.reason }),
    };

    debugLog('refund', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track community join
   * @param params - Community join parameters
   */
  joinCommunity(params: {
    community_id: string;
    community_name: string;
    community_city?: string;
  }): void {
    const eventParams = {
      event: 'join_community',
      community_id: params.community_id,
      community_name: params.community_name,
      ...(params.community_city && { community_city: params.community_city }),
    };

    debugLog('join_community', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track community leave
   * @param params - Community leave parameters
   */
  leaveCommunity(params: {
    community_id: string;
    community_name: string;
    community_city?: string;
  }): void {
    const eventParams = {
      event: 'leave_community',
      community_id: params.community_id,
      community_name: params.community_name,
      ...(params.community_city && { community_city: params.community_city }),
    };

    debugLog('leave_community', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track community view
   * @param params - Community view parameters
   */
  viewCommunity(params: {
    community_id: string;
    community_name: string;
    community_city?: string;
    member_count?: number;
  }): void {
    const eventParams = {
      event: 'view_community',
      community_id: params.community_id,
      community_name: params.community_name,
      ...(params.community_city && { community_city: params.community_city }),
      ...(params.member_count !== undefined && { member_count: params.member_count }),
    };

    debugLog('view_community', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track discussion creation
   * @param params - Discussion creation parameters
   */
  createDiscussion(params: {
    discussion_id: string;
    community_id: string;
    title: string;
  }): void {
    const eventParams = {
      event: 'create_discussion',
      discussion_id: params.discussion_id,
      community_id: params.community_id,
      discussion_title: params.title,
    };

    debugLog('create_discussion', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track comment creation
   * @param params - Comment creation parameters
   */
  createComment(params: {
    comment_id: string;
    discussion_id: string;
    comment_length?: number;
  }): void {
    const eventParams = {
      event: 'create_comment',
      comment_id: params.comment_id,
      discussion_id: params.discussion_id,
      ...(params.comment_length !== undefined && { comment_length: params.comment_length }),
    };

    debugLog('create_comment', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track search queries
   * @param params - Search parameters
   */
  search(params: {
    search_term: string;
    search_type?: string;
    results_count?: number;
  }): void {
    const eventParams = {
      event: 'search',
      search_term: params.search_term,
      ...(params.search_type && { search_type: params.search_type }),
      ...(params.results_count !== undefined && { results_count: params.results_count }),
    };

    debugLog('search', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Track discussion view
   * @param params - Discussion view parameters
   */
  viewDiscussion(params: {
    discussion_id: string;
    discussion_title: string;
    community_id: string;
  }): void {
    const eventParams = {
      event: 'view_discussion',
      discussion_id: params.discussion_id,
      discussion_title: params.discussion_title,
      community_id: params.community_id,
    };

    debugLog('view_discussion', eventParams);
    pushToDataLayer(eventParams);
  },

  /**
   * Initialize analytics (called once on app load)
   */
  init(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    debugLog('Analytics initialized');
  },
};

export default analytics;

