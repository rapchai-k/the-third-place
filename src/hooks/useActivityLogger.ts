import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityLogParams {
  action_type: string;
  target_type: string;
  target_id?: string;
  metadata?: Record<string, any>;
  anonymous?: boolean;
}

export const useActivityLogger = () => {
  const { user } = useAuth();

  const logActivity = useCallback(async (params: ActivityLogParams) => {
    try {
      // If no user and not explicitly anonymous, skip logging
      if (!user && !params.anonymous) {
        return;
      }

      const { data, error } = await supabase.functions.invoke('log-activity', {
        body: params
      });

      if (error) {
<<<<<<< HEAD
        // Failed to log activity - logging removed for security
=======
        console.warn('Failed to log activity:', error);
>>>>>>> 193db8a94be7a7b5ace78e2adf90eaea66f0146c
      }

      return data;
    } catch (error) {
<<<<<<< HEAD
      // Activity logging error - logging removed for security
=======
      console.warn('Activity logging error:', error);
>>>>>>> 193db8a94be7a7b5ace78e2adf90eaea66f0146c
    }
  }, [user]);

  // Pre-defined activity loggers for common actions
  const logPageView = useCallback((page: string, metadata?: Record<string, any>) => {
    // TEMPORARILY DISABLED - return early without logging
    return Promise.resolve();

    // return logActivity({
    //   action_type: 'page_view',
    //   target_type: 'page',
    //   target_id: page,
    //   metadata,
    //   anonymous: true
    // });
  }, [logActivity]);

  const logEventView = useCallback((eventId: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'view',
      target_type: 'event',
      target_id: eventId,
      metadata
    });
  }, [logActivity]);

  const logEventRegistration = useCallback((eventId: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'register',
      target_type: 'event',
      target_id: eventId,
      metadata
    });
  }, [logActivity]);

  const logPaymentInitiated = useCallback((eventId: string, amount: number, currency: string) => {
    return logActivity({
      action_type: 'payment_initiated',
      target_type: 'event',
      target_id: eventId,
      metadata: { amount, currency }
    });
  }, [logActivity]);

  const logPaymentCompleted = useCallback((eventId: string, amount: number, currency: string, paymentId?: string) => {
    return logActivity({
      action_type: 'payment_completed',
      target_type: 'event',
      target_id: eventId,
      metadata: { amount, currency, payment_id: paymentId }
    });
  }, [logActivity]);

  const logCommunityJoin = useCallback((communityId: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'join',
      target_type: 'community',
      target_id: communityId,
      metadata
    });
  }, [logActivity]);

  const logCommunityLeave = useCallback((communityId: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'leave',
      target_type: 'community',
      target_id: communityId,
      metadata
    });
  }, [logActivity]);

  const logDiscussionView = useCallback((discussionId: string, metadata?: Record<string, any>) => {
    // TEMPORARILY DISABLED - return early without logging
    return Promise.resolve();

    // return logActivity({
    //   action_type: 'view',
    //   target_type: 'discussion',
    //   target_id: discussionId,
    //   metadata
    // });
  }, [logActivity]);

  const logCommentCreate = useCallback((discussionId: string, commentId: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'comment',
      target_type: 'discussion',
      target_id: discussionId,
      metadata: { comment_id: commentId, ...metadata }
    });
  }, [logActivity]);

  const logCommentFlag = useCallback((commentId: string, flaggedUserId: string, reason: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'flag',
      target_type: 'comment',
      target_id: commentId,
      metadata: { flagged_user_id: flaggedUserId, reason, ...metadata }
    });
  }, [logActivity]);

  // Community view logging
  const logCommunityView = useCallback((communityId: string, metadata?: Record<string, any>) => {
    // TEMPORARILY DISABLED - return early without logging
    return Promise.resolve();

    // return logActivity({
    //   action_type: 'view',
    //   target_type: 'community',
    //   target_id: communityId,
    //   metadata
    // });
  }, [logActivity]);

  // Event registration cancellation logging
  const logEventRegistrationCancel = useCallback((eventId: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'cancel_registration',
      target_type: 'event',
      target_id: eventId,
      metadata
    });
  }, [logActivity]);

  // Payment failure logging
  const logPaymentFailed = useCallback((eventId: string, amount: number, currency: string, reason?: string) => {
    return logActivity({
      action_type: 'payment_failed',
      target_type: 'event',
      target_id: eventId,
      metadata: { amount, currency, failure_reason: reason }
    });
  }, [logActivity]);

  // Payment timeout/stuck logging
  const logPaymentTimeout = useCallback((eventId: string, amount: number, currency: string) => {
    return logActivity({
      action_type: 'payment_timeout',
      target_type: 'event',
      target_id: eventId,
      metadata: { amount, currency }
    });
  }, [logActivity]);

  // Discussion creation logging
  const logDiscussionCreate = useCallback((discussionId: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'create',
      target_type: 'discussion',
      target_id: discussionId,
      metadata
    });
  }, [logActivity]);

  // User profile view logging
  const logProfileView = useCallback((profileUserId: string, metadata?: Record<string, any>) => {
    // TEMPORARILY DISABLED - return early without logging
    return Promise.resolve();

    // return logActivity({
    //   action_type: 'view',
    //   target_type: 'profile',
    //   target_id: profileUserId,
    //   metadata
    // });
  }, [logActivity]);

  // User profile edit logging
  const logProfileEdit = useCallback((profileUserId: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'edit',
      target_type: 'profile',
      target_id: profileUserId,
      metadata
    });
  }, [logActivity]);

  return {
    logActivity,
    logPageView,
    logEventView: useCallback((eventId: string, metadata?: Record<string, any>) => {
      // TEMPORARILY DISABLED - return early without logging
      return Promise.resolve();

      // return logActivity({
      //   action_type: 'view',
      //   target_type: 'event',
      //   target_id: eventId,
      //   metadata
      // });
    }, [logActivity]),
    logEventRegistration,
    logEventRegistrationCancel,
    logPaymentInitiated,
    logPaymentCompleted,
    logPaymentFailed,
    logPaymentTimeout,
    logCommunityJoin,
    logCommunityLeave,
    logCommunityView,
    logDiscussionView,
    logDiscussionCreate,
    logCommentCreate,
    logCommentFlag,
    logProfileView,
    logProfileEdit
  };
};