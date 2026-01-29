import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { WhatsAppCollectionModal } from "@/components/WhatsAppCollectionModal";
import { PaymentButton } from "@/components/PaymentButton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, UserCheck, CreditCard } from "lucide-react";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useState } from "react";
import { queryKeys } from "@/utils/queryKeys";

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

  // Check if user has pending/completed payment for this event (define this first for refetch logic)
  const queryClient = useQueryClient();
  const { data: pendingPayment } = useQuery({
    queryKey: queryKeys.events.pendingPayment(eventId, user?.id),
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('payment_sessions')
        .select('id, payment_status, payment_url')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && price > 0
  });

  // Check if user is registered - with auto-refetch when payment is complete but registration not reflected
  const hasCompletedPaymentEarly = pendingPayment && pendingPayment.payment_status === 'paid';
  const { data: userRegistration, isLoading } = useQuery({
    queryKey: queryKeys.events.registration(eventId, user?.id),
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    // Auto-refetch every 2 seconds when payment is complete but registration not yet reflected
    // Use a function to access the current data without causing temporal dead zone issues
    refetchInterval: (query) => {
      const currentData = query.state.data;
      return hasCompletedPaymentEarly && !currentData ? 2000 : false;
    }
  });

  // Check if user has WhatsApp number
  const { data: userProfile } = useQuery({
    queryKey: queryKeys.user.profile(user?.id),
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
  const isPaidEvent = price > 0;
  const hasPendingPayment = pendingPayment && pendingPayment.payment_status === 'yet_to_pay';
  const hasCompletedPayment = pendingPayment && pendingPayment.payment_status === 'paid';
  // Check for terminal payment states that allow retry (cancelled, expired, failed)
  const hasTerminalPaymentState = pendingPayment &&
    ['cancelled', 'expired', 'failed'].includes(pendingPayment.payment_status || '');

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

  // For paid events, show PaymentButton instead of registration button
  if (isPaidEvent) {
    const handlePaymentSuccess = () => {
      // Refetch registration status after successful payment
      queryClient.invalidateQueries({ queryKey: queryKeys.events.registration(eventId, user?.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.pendingPayment(eventId, user?.id) });
    };

    // Show "Payment Complete" if already paid but registration not yet reflected
    // Only show this for truly "paid" status, not for cancelled/expired/failed
    if (hasCompletedPayment && !isRegistered && !hasTerminalPaymentState) {
      return (
        <Button variant="secondary" disabled className={className}>
          <CreditCard className="w-4 h-4 mr-2" />
          Payment Complete - Processing...
        </Button>
      );
    }

    // Show PaymentButton for paid events (user not registered yet)
    // This includes: no payment session, pending payment, or terminal states (cancelled/expired/failed)
    return (
      <PaymentButton
        eventId={eventId}
        eventTitle={eventTitle}
        price={price}
        currency={currency}
        className={className}
        onPaymentSuccess={handlePaymentSuccess}
      />
    );
  }

  // Handle registration for FREE events only
  const handleRegistration = () => {
    // If user already has WhatsApp number, proceed directly to registration
    if (userProfile?.whatsapp_number) {
      logEventRegistration(eventId, {
        event_type: 'free',
        event_title: eventTitle,
        event_date: eventDate,
        price: 0,
        currency: currency,
        registration_type: 'free'
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
      event_type: 'free',
      event_title: eventTitle,
      event_date: eventDate,
      price: 0,
      currency: currency,
      registration_type: 'free'
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
          eventType="free"
        />
      )}
    </>
  );
};