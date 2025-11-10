import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityLogger } from '@/hooks/useActivityLogger';

export const useEventRegistration = (eventId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logEventRegistrationCancel } = useActivityLogger();

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // All events (free and paid) create registration with 'registered' status
      // For paid events, payment tracking is separate via payment_sessions table
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered'
        });

      if (error) throw error;
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
      
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
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