import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, UserCheck } from "lucide-react";

interface EventRegistrationButtonProps {
  eventId: string;
  eventDate: string;
  capacity: number;
  currentAttendees: number;
  className?: string;
}

export const EventRegistrationButton = ({ 
  eventId, 
  eventDate, 
  capacity, 
  currentAttendees,
  className 
}: EventRegistrationButtonProps) => {
  const { user } = useAuth();
  const { register, cancel, isRegistering, isCancelling } = useEventRegistration(eventId);

  // Check if user is registered
  const { data: userRegistration, isLoading } = useQuery({
    queryKey: ['user-registration', eventId],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  const isPastEvent = new Date(eventDate) < new Date();
  const isFullyBooked = currentAttendees >= capacity;
  const isRegistered = !!userRegistration;

  if (!user) {
    return (
      <Button 
        variant="outline" 
        onClick={() => window.location.href = '/auth'}
        className={className}
      >
        Sign in to Register
      </Button>
    );
  }

  if (isPastEvent) {
    return (
      <Button variant="secondary" disabled className={className}>
        Event Ended
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button disabled className={className}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isRegistered) {
    return (
      <Button 
        variant="destructive" 
        onClick={() => cancel()}
        disabled={isCancelling}
        className={className}
      >
        {isCancelling ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Cancelling...
          </>
        ) : (
          <>
            <UserCheck className="w-4 h-4 mr-2" />
            Cancel Registration
          </>
        )}
      </Button>
    );
  }

  if (isFullyBooked) {
    return (
      <Button variant="secondary" disabled className={className}>
        <Users className="w-4 h-4 mr-2" />
        Fully Booked
      </Button>
    );
  }

  return (
    <Button 
      onClick={() => register()}
      disabled={isRegistering}
      className={className}
    >
      {isRegistering ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Registering...
        </>
      ) : (
        <>
          <Users className="w-4 h-4 mr-2" />
          Register for Event
        </>
      )}
    </Button>
  );
};