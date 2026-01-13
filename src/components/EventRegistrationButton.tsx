import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { WhatsAppCollectionModal } from "@/components/WhatsAppCollectionModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, UserCheck } from "lucide-react";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useState } from "react";

interface EventRegistrationButtonProps {
  eventId: string;
  eventDate: string;
  capacity: number;
  currentAttendees: number;
  eventTitle: string;
  communityId?: string;
  communityName?: string;
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
  communityId,
  communityName,
  price = 0,
  currency = 'INR',
  className
}: EventRegistrationButtonProps) => {
  const { user } = useAuth();
  const { register, cancel, isRegistering, isCancelling, registrationStep } = useEventRegistration({
    eventId,
    communityId,
    communityName,
    price,
    currency
  });
  const { logEventRegistration } = useActivityLogger();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

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

  // Check if user has WhatsApp number
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('users')
        .select('whatsapp_number')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Treat null dates as upcoming events (not past events)
  const eventDateObj = eventDate ? new Date(eventDate) : null;
  const isPastEvent = eventDateObj ? eventDateObj < new Date() : false;
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

  // Handle registration for all events (both free and paid)
  // All events create registration with 'registered' status
  // For paid events, payment tracking is separate via payment_sessions table
  const handleRegistration = () => {
    // If user already has WhatsApp number, proceed directly to registration
    if (userProfile?.whatsapp_number) {
      logEventRegistration(eventId, {
        event_type: price > 0 ? 'paid' : 'free',
        event_title: eventTitle,
        event_date: eventDate,
        price: price,
        currency: currency,
        registration_type: price > 0 ? 'interest' : 'free'
      });
      register();
    } else {
      // Show WhatsApp collection modal
      setShowWhatsAppModal(true);
    }
  };

  const handleWhatsAppSuccess = () => {
    // After WhatsApp number is saved, proceed with registration
    logEventRegistration(eventId, {
      event_type: price > 0 ? 'paid' : 'free',
      event_title: eventTitle,
      event_date: eventDate,
      price: price,
      currency: currency,
      registration_type: price > 0 ? 'interest' : 'free'
    });
    register();
  };

  // Get the appropriate loading text based on registration step
  const getLoadingText = () => {
    switch (registrationStep) {
      case 'joining-community':
        return 'Joining community...';
      case 'registering':
        return 'Registering...';
      default:
        return 'Registering...';
    }
  };

  return (
    <>
      <Button
        onClick={handleRegistration}
        disabled={isRegistering}
        className={className}
      >
        {isRegistering ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {getLoadingText()}
          </>
        ) : (
          <>
            <Users className="w-4 h-4 mr-2" />
            I'm interested
          </>
        )}
      </Button>

      {user && (
        <WhatsAppCollectionModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          onSuccess={handleWhatsAppSuccess}
          userId={user.id}
          eventType={price > 0 ? "paid" : "free"}
        />
      )}
    </>
  );
};