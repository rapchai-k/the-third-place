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
        console.warn('Failed to log activity:', error);
      }

      return data;
    } catch (error) {
      console.warn('Activity logging error:', error);
    }
  }, [user]);

  // Pre-defined activity loggers for common actions
  const logPageView = useCallback((page: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'page_view',
      target_type: 'page',
      target_id: page,
      metadata,
      anonymous: true
    });
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

  const logDiscussionView = useCallback((discussionId: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'view',
      target_type: 'discussion',
      target_id: discussionId,
      metadata
    });
  }, [logActivity]);

  const logCommentCreate = useCallback((discussionId: string, commentId: string, metadata?: Record<string, any>) => {
    return logActivity({
      action_type: 'comment',
      target_type: 'discussion',
      target_id: discussionId,
      metadata: { comment_id: commentId, ...metadata }
    });
  }, [logActivity]);

  return {
    logActivity,
    logPageView,
    logEventView,
    logEventRegistration,
    logPaymentInitiated,
    logPaymentCompleted,
    logCommunityJoin,
    logDiscussionView,
    logCommentCreate
  };
};