import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { PaymentButton } from "@/components/PaymentButton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, UserCheck } from "lucide-react";
import { useActivityLogger } from "@/hooks/useActivityLogger";

interface EventRegistrationButtonProps {
  eventId: string;
  eventDate: string;
  capacity: number;
  currentAttendees: number;
  eventTitle: string;
  price?: number;
  currency?: string;
  className?: string;
}

export const EventRegistrationButton = ({ 
  eventId, 
  eventDate, 
  capacity, 
  currentAttendees,
  eventTitle,
  price = 0,
  currency = 'INR',
  className 
}: EventRegistrationButtonProps) => {
  const { user } = useAuth();
  const { register, cancel, isRegistering, isCancelling } = useEventRegistration(eventId);
  const { logEventRegistration } = useActivityLogger();

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

  // If event has a price, show payment button instead
  if (price > 0) {
    return (
      <PaymentButton
        eventId={eventId}
        eventTitle={eventTitle}
        price={price}
        currency={currency}
        className={className}
        onPaymentSuccess={() => window.location.reload()} // Refresh to update registration status
      />
    );
  }

  // Free event - use original registration flow
  const handleFreeRegistration = () => {
    logEventRegistration(eventId, {
      event_type: 'free',
      event_title: eventTitle,
      event_date: eventDate,
      price: 0,
      currency: currency,
      registration_type: 'free'
    });
    register();
  };

  return (
    <Button 
      onClick={handleFreeRegistration}
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
          Register for Free
        </>
      )}
    </Button>
  );
};