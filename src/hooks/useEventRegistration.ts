import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useState } from 'react';
import { queryKeys } from '@/utils/queryKeys';

interface UseEventRegistrationParams {
  eventId: string;
  communityId?: string;
  price?: number;
  currency?: string;
  communityName?: string;
}

// Registration step for UI feedback
export type RegistrationStep = 'idle' | 'joining-community' | 'registering';

export const useEventRegistration = ({
  eventId,
  communityId,
  price = 0,
  currency = 'INR',
  communityName
}: UseEventRegistrationParams) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logEventRegistrationCancel, logCommunityJoin } = useActivityLogger();
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('idle');

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Step 1: Check if user is a member of the event's community
      if (communityId) {
        setRegistrationStep('joining-community');

        const { data: membershipData, error: membershipError } = await supabase
          .from('community_members')
          .select('user_id')
          .eq('community_id', communityId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (membershipError) {
          throw new Error('Failed to check community membership');
        }

        // If not a member, auto-join the community
        if (!membershipData) {
          const { error: joinError } = await supabase
            .from('community_members')
            .insert({
              community_id: communityId,
              user_id: user.id
            });

          if (joinError) {
            throw new Error('Failed to join community. Please try again.');
          }

          // Log community join activity
          logCommunityJoin(communityId, {
            community_name: communityName || 'Unknown',
            auto_join: true,
            source: 'event_registration'
          });

          // Invalidate community membership queries
          queryClient.invalidateQueries({ queryKey: queryKeys.communities.membership(communityId, user.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.user.memberships(user.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.communities.detail(communityId) });
        }
      }

      // Step 2: Create registration with 'registered' status for all events
      setRegistrationStep('registering');

      const { error: registrationError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered'
        });

      if (registrationError) throw registrationError;

      // Note: Payment session creation for paid events is now handled by PaymentButton
      // This hook is only used for FREE event registrations
    },
    onMutate: async () => {
      // Cancel outgoing refetches for all registration-related queries
      const registrationKey = queryKeys.events.registration(eventId, user?.id);
      const eventKey = queryKeys.events.detail(eventId);

      await queryClient.cancelQueries({ queryKey: registrationKey });
      await queryClient.cancelQueries({ queryKey: eventKey });

      // Snapshot previous values
      const previousRegistration = queryClient.getQueryData(registrationKey);
      const previousEvent = queryClient.getQueryData(eventKey);

      // Optimistically update registration status
      const optimisticData = {
        user_id: user?.id,
        event_id: eventId,
        status: 'registered'
      };

      queryClient.setQueryData(registrationKey, optimisticData);

      // Update event attendee count optimistically
      if (previousEvent) {
        queryClient.setQueryData(eventKey, (old: any) => ({
          ...old,
          event_registrations: [{
            count: (old.event_registrations?.[0]?.count || 0) + 1
          }]
        }));
      }

      // Show success toast immediately
      toast({
        title: "Registered!",
        description: "You're now registered for this event.",
      });

      return { previousRegistration, previousEvent };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      const registrationKey = queryKeys.events.registration(eventId, user?.id);
      const eventKey = queryKeys.events.detail(eventId);

      if (context?.previousRegistration !== undefined) {
        queryClient.setQueryData(registrationKey, context.previousRegistration);
      }
      if (context?.previousEvent !== undefined) {
        queryClient.setQueryData(eventKey, context.previousEvent);
      }

      const errorMessage = err instanceof Error ? err.message : 'Please try again';
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      setRegistrationStep('idle');
    },
    onSettled: () => {
      // Reset registration step
      setRegistrationStep('idle');
      // Always refetch after error or success for all registration-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.events.registration(eventId, user?.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Delete registration
      const { error: registrationError } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (registrationError) throw registrationError;

      // For paid events, handle payment sessions appropriately
      if (price > 0) {
        // Delete any unpaid payment sessions
        await supabase
          .from('payment_sessions')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .eq('payment_status', 'yet_to_pay');

        // Mark any paid payment sessions as 'cancelled' (for refund tracking)
        // This prevents the "Payment Complete - Processing..." stuck state
        await supabase
          .from('payment_sessions')
          .update({
            status: 'cancelled',
            payment_status: 'cancelled'
          })
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .eq('payment_status', 'paid');
      }
    },
    onMutate: async () => {
      // Cancel outgoing refetches for all registration-related queries
      const registrationKey = queryKeys.events.registration(eventId, user?.id);
      const eventKey = queryKeys.events.detail(eventId);

      await queryClient.cancelQueries({ queryKey: registrationKey });
      await queryClient.cancelQueries({ queryKey: eventKey });

      // Snapshot previous values
      const previousRegistration = queryClient.getQueryData(registrationKey);
      const previousEvent = queryClient.getQueryData(eventKey);

      // Optimistically remove registration
      queryClient.setQueryData(registrationKey, null);

      // Update event attendee count optimistically
      if (previousEvent) {
        queryClient.setQueryData(eventKey, (old: any) => ({
          ...old,
          event_registrations: [{
            count: Math.max((old.event_registrations?.[0]?.count || 0) - 1, 0)
          }]
        }));
      }

      // Log registration cancellation
      logEventRegistrationCancel(eventId, {
        user_id: user?.id,
        cancelled_at: new Date().toISOString()
      });

      // Show success toast immediately
      toast({
        title: "Registration cancelled",
        description: "You're no longer registered for this event.",
      });

      return { previousRegistration, previousEvent };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      const registrationKey = queryKeys.events.registration(eventId, user?.id);
      const eventKey = queryKeys.events.detail(eventId);

      if (context?.previousRegistration !== undefined) {
        queryClient.setQueryData(registrationKey, context.previousRegistration);
      }
      if (context?.previousEvent !== undefined) {
        queryClient.setQueryData(eventKey, context.previousEvent);
      }

      toast({
        title: "Cancellation failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success for all registration-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.events.registration(eventId, user?.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
    }
  });

  return {
    register: registerMutation.mutate,
    cancel: cancelMutation.mutate,
    isRegistering: registerMutation.isPending,
    isCancelling: cancelMutation.isPending,
    registrationStep,
  };
};