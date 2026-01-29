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

