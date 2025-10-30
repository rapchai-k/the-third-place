import { useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface WelcomeEmailStatus {
  welcomeEmailSent: boolean;
  sentAt: string | null;
}

interface TriggerWelcomeEmailRequest {
  userId: string;
  userEmail: string;
  userName: string;
}

interface TriggerWelcomeEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  alreadySent?: boolean;
}

/**
 * Hook to manage welcome email functionality
 * Automatically checks if a welcome email needs to be sent for new users
 * and provides manual trigger capability
 */
export const useWelcomeEmail = () => {
  const { user, session } = useAuth();
  const hasTriggeredRef = useRef(false);

  // Query to check welcome email status
  const { data: welcomeEmailStatus, isLoading } = useQuery({
    queryKey: ['welcomeEmailStatus', user?.id],
    queryFn: async (): Promise<WelcomeEmailStatus> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('users')
        .select('welcome_email_sent_at')
        .eq('id', user.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch welcome email status: ${error.message}`);
      }

      return {
        welcomeEmailSent: !!data.welcome_email_sent_at,
        sentAt: data.welcome_email_sent_at
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Mutation to trigger welcome email
  const triggerWelcomeEmailMutation = useMutation({
    mutationFn: async (request: TriggerWelcomeEmailRequest): Promise<TriggerWelcomeEmailResponse> => {
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const { data, error } = await supabase.functions.invoke('welcome-email-trigger', {
        body: request,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(`Failed to trigger welcome email: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.alreadySent) {
        // Welcome email was already sent - logging removed for security
      } else if (data.success) {
        toast({
          title: "Welcome email sent!",
          description: "Check your inbox for your welcome message.",
        });
      }
    },
    onError: (error) => {
      // Failed to trigger welcome email - logging removed for security
      toast({
        title: "Email delivery issue",
        description: "We couldn't send your welcome email right now. Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Auto-trigger welcome email for new users
  useEffect(() => {
    const shouldTriggerWelcomeEmail = 
      user && 
      user.email && 
      welcomeEmailStatus && 
      !welcomeEmailStatus.welcomeEmailSent && 
      !hasTriggeredRef.current &&
      !triggerWelcomeEmailMutation.isPending;

    if (shouldTriggerWelcomeEmail) {
      hasTriggeredRef.current = true;

      // Get user name from metadata or default
      const userName = user.user_metadata?.name || 
                      user.user_metadata?.full_name || 
                      user.email?.split('@')[0] || 
                      'User';

      // Auto-triggering welcome email for new user - logging removed for security

      triggerWelcomeEmailMutation.mutate({
        userId: user.id,
        userEmail: user.email,
        userName: userName
      });
    }
  }, [user, welcomeEmailStatus, triggerWelcomeEmailMutation]);

  // Manual trigger function
  const triggerWelcomeEmail = async () => {
    if (!user || !user.email) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return;
    }

    const userName = user.user_metadata?.name || 
                    user.user_metadata?.full_name || 
                    user.email.split('@')[0] || 
                    'User';

    triggerWelcomeEmailMutation.mutate({
      userId: user.id,
      userEmail: user.email,
      userName: userName
    });
  };

  return {
    welcomeEmailStatus,
    isLoading,
    triggerWelcomeEmail,
    isTriggering: triggerWelcomeEmailMutation.isPending,
    triggerError: triggerWelcomeEmailMutation.error,
    lastTriggerResult: triggerWelcomeEmailMutation.data
  };
};
