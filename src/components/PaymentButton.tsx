import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useActivityLogger } from "@/hooks/useActivityLogger";

interface PaymentButtonProps {
  eventId: string;
  eventTitle: string;
  price: number;
  currency: string;
  className?: string;
  onPaymentSuccess?: () => void;
}

export const PaymentButton = ({
  eventId,
  eventTitle,
  price,
  currency,
  className,
  onPaymentSuccess
}: PaymentButtonProps) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const { logPaymentInitiated, logPaymentCompleted, logPaymentFailed, logPaymentTimeout, logEventRegistration } = useActivityLogger();

  // Refs for managing polling state
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const paymentSessionIdRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);

  // Cleanup function to stop all polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Handle focus event to check payment status
  useEffect(() => {
    const handleFocus = () => {
      if (paymentSessionIdRef.current && isPollingRef.current) {
        verifyPayment(paymentSessionIdRef.current);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const verifyPayment = async (paymentSessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { paymentSessionId }
      });

      if (error) throw error;

      if (data.payment_status === 'paid') {
        // Stop polling immediately
        stopPolling();
        setIsProcessing(false);

        // Log successful payment
        logPaymentCompleted(eventId, price, currency, data.payment_id);

        // Log event registration completion
        logEventRegistration(eventId, {
          event_title: eventTitle,
          registration_type: 'paid',
          payment_id: data.payment_id,
          amount: price,
          currency: currency
        });

        toast({
          title: "Payment successful!",
          description: "You are now registered for the event.",
        });
        onPaymentSuccess?.();
      }
      // If still 'yet_to_pay', polling will continue automatically
    } catch (error) {
      // Log payment verification error but don't stop polling
      console.error('Payment verification error:', error);
    }
  };

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { eventId }
      });

      if (error) throw error;
      if (!data?.payment_url) throw new Error('Payment URL not received');

      return data;
    },
    onSuccess: (data) => {
      // Log payment initiation
      logPaymentInitiated(eventId, price, currency);

      // Open payment URL in new tab
      window.open(data.payment_url, '_blank');

      // Start polling for payment status
      startPolling(data.payment_session_id);

      toast({
        title: "Redirecting to payment",
        description: "Please complete your payment in the new tab.",
      });
    },
    onError: (error) => {
      // Log payment initialization failure
      logPaymentFailed(eventId, price, currency, `Initialization failed: ${error.message}`);

      toast({
        title: "Payment initialization failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const startPolling = (paymentSessionId: string) => {
    // Stop any existing polling first
    stopPolling();

    setIsProcessing(true);
    paymentSessionIdRef.current = paymentSessionId;
    isPollingRef.current = true;

    // Poll every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      if (isPollingRef.current) {
        verifyPayment(paymentSessionId);
      }
    }, 3000);

    // Stop polling after 5 minutes
    pollTimeoutRef.current = setTimeout(() => {
      if (isPollingRef.current) {
        stopPolling();
        setIsProcessing(false);

        // Log payment timeout
        logPaymentTimeout(eventId, price, currency);

        toast({
          title: "Payment verification timeout",
          description: "Please refresh the page to check your registration status.",
          variant: "destructive",
        });
      }
    }, 300000);
  };

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

  const handlePayment = () => {
    createPaymentMutation.mutate();
  };

  return (
    <Button 
      onClick={handlePayment}
      disabled={createPaymentMutation.isPending || isProcessing}
      className={className}
    >
      {createPaymentMutation.isPending || isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {isProcessing ? 'Processing...' : 'Initializing...'}
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pay {currency} {price}
        </>
      )}
    </Button>
  );
};