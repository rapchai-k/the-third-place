import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityLogger } from '@/hooks/useActivityLogger';

interface UseEventRegistrationParams {
  eventId: string;
  price?: number;
  currency?: string;
}

export const useEventRegistration = ({ eventId, price = 0, currency = 'INR' }: UseEventRegistrationParams) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logEventRegistrationCancel } = useActivityLogger();

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('🔍 Registration Debug:', { eventId, price, currency, userId: user.id });

      // Step 1: Create registration with 'registered' status for all events
      const { error: registrationError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered'
        });

      if (registrationError) throw registrationError;
      console.log('✅ Registration created successfully');

      // Step 2: For paid events, create payment session with 'yet_to_pay' status
      if (price > 0) {
        console.log('💰 Creating payment session for paid event...');
        const { error: paymentError } = await supabase
          .from('payment_sessions')
          .insert({
            user_id: user.id,
            event_id: eventId,
            amount: price,
            currency: currency,
            status: 'pending', // Keep old field for backward compatibility
            payment_status: 'yet_to_pay',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
          });

        if (paymentError) {
          console.error('❌ Payment session creation failed:', paymentError);
          throw paymentError;
        }
        console.log('✅ Payment session created successfully');
      } else {
        console.log('ℹ️ Free event - no payment session needed');
      }
    },
    onMutate: async () => {
      // Cancel outgoing refetches for all registration-related queries
      await queryClient.cancelQueries({ queryKey: ['user-registration', eventId] });
      await queryClient.cancelQueries({ queryKey: ['userRegistration', eventId, user?.id] });
      await queryClient.cancelQueries({ queryKey: ['event', eventId] });

      // Snapshot previous values
      const previousRegistration = queryClient.getQueryData(['user-registration', eventId]);
      const previousRegistrationAlt = queryClient.getQueryData(['userRegistration', eventId, user?.id]);
      const previousEvent = queryClient.getQueryData(['event', eventId]);

      // Optimistically update registration status for both query keys
      const optimisticData = {
        user_id: user?.id,
        event_id: eventId,
        status: 'registered'
      };

      queryClient.setQueryData(['user-registration', eventId], optimisticData);
      queryClient.setQueryData(['userRegistration', eventId, user?.id], optimisticData);

      // Update event attendee count optimistically
      if (previousEvent) {
        queryClient.setQueryData(['event', eventId], (old: any) => ({
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

      return { previousRegistration, previousRegistrationAlt, previousEvent };
    },
    onError: (err, variables, context) => {
      // Rollback on error for both query keys
      if (context?.previousRegistration !== undefined) {
        queryClient.setQueryData(['user-registration', eventId], context.previousRegistration);
      }
      if (context?.previousRegistrationAlt !== undefined) {
        queryClient.setQueryData(['userRegistration', eventId, user?.id], context.previousRegistrationAlt);
      }
      if (context?.previousEvent !== undefined) {
        queryClient.setQueryData(['event', eventId], context.previousEvent);
      }

      toast({
        title: "Registration failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success for all registration-related queries
      queryClient.invalidateQueries({ queryKey: ['user-registration', eventId] });
      queryClient.invalidateQueries({ queryKey: ['userRegistration', eventId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
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

      // For paid events, also delete any unpaid payment sessions
      if (price > 0) {
        const { error: paymentError } = await supabase
          .from('payment_sessions')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .eq('payment_status', 'yet_to_pay');

        // Don't throw error if payment session doesn't exist or is already paid
        if (paymentError && paymentError.code !== 'PGRST116') {
          console.warn('Failed to delete payment session:', paymentError);
        }
      }
    },
    onMutate: async () => {
      // Cancel outgoing refetches for all registration-related queries
      await queryClient.cancelQueries({ queryKey: ['user-registration', eventId] });
      await queryClient.cancelQueries({ queryKey: ['userRegistration', eventId, user?.id] });
      await queryClient.cancelQueries({ queryKey: ['event', eventId] });

      // Snapshot previous values
      const previousRegistration = queryClient.getQueryData(['user-registration', eventId]);
      const previousRegistrationAlt = queryClient.getQueryData(['userRegistration', eventId, user?.id]);
      const previousEvent = queryClient.getQueryData(['event', eventId]);

      // Optimistically remove registration for both query keys
      queryClient.setQueryData(['user-registration', eventId], null);
      queryClient.setQueryData(['userRegistration', eventId, user?.id], null);

      // Update event attendee count optimistically
      if (previousEvent) {
        queryClient.setQueryData(['event', eventId], (old: any) => ({
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

      return { previousRegistration, previousRegistrationAlt, previousEvent };
    },
    onError: (err, variables, context) => {
      // Rollback on error for both query keys
      if (context?.previousRegistration !== undefined) {
        queryClient.setQueryData(['user-registration', eventId], context.previousRegistration);
      }
      if (context?.previousRegistrationAlt !== undefined) {
        queryClient.setQueryData(['userRegistration', eventId, user?.id], context.previousRegistrationAlt);
      }
      if (context?.previousEvent !== undefined) {
        queryClient.setQueryData(['event', eventId], context.previousEvent);
      }

      toast({
        title: "Cancellation failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success for all registration-related queries
      queryClient.invalidateQueries({ queryKey: ['user-registration', eventId] });
      queryClient.invalidateQueries({ queryKey: ['userRegistration', eventId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    }
  });

  return {
    register: registerMutation.mutate,
    cancel: cancelMutation.mutate,
    isRegistering: registerMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
};