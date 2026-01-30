import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useAppSettings } from "@/hooks/useAppSettings";
import { invokeWithTimeoutRace, TIMEOUT_VALUES } from "@/utils/supabaseWithTimeout";
import { analytics } from "@/utils/analytics";

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
  const { paymentsEnabled, isLoading: isLoadingSettings } = useAppSettings();
  const [isProcessing, setIsProcessing] = useState(false);
  const { logPaymentInitiated, logPaymentCompleted, logPaymentFailed, logPaymentTimeout, logEventRegistration } = useActivityLogger();

  // Refs for managing polling state
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const paymentSessionIdRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);
  const pollCountRef = useRef<number>(0);
  const MAX_POLL_ATTEMPTS = 60; // Max 60 attempts (5 minutes at 5-second intervals)

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
      const { data, error } = await invokeWithTimeoutRace<{ payment_status: string; payment_id?: string }>(
        'verify-payment',
        { body: { paymentSessionId } },
        TIMEOUT_VALUES.PAYMENT
      );

      if (error) throw error;

      if (data?.payment_status === 'paid') {
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

        // Track purchase for GA4 e-commerce
        analytics.purchase({
          transaction_id: data.payment_id || paymentSessionId,
          value: price,
          currency: currency,
          items: [
            {
              item_id: eventId,
              item_name: eventTitle,
              price: price,
              quantity: 1,
            },
          ],
        });

        toast({
          title: "Payment successful!",
          description: "You are now registered for the event.",
        });
        onPaymentSuccess?.();
      }
      // If still 'yet_to_pay', polling will continue automatically
    } catch (error) {
      // Payment verification error - continue polling
    }
  };

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await invokeWithTimeoutRace<{ payment_url: string; payment_session_id: string }>(
        'create-payment',
        { body: { eventId } },
        TIMEOUT_VALUES.PAYMENT
      );

      if (error) throw error;
      if (!data?.payment_url) throw new Error('Payment URL not received');

      return data;
    },
    onSuccess: (data) => {
      // Log payment initiation
      logPaymentInitiated(eventId, price, currency);

      // Track begin_checkout for GA4 e-commerce
      analytics.beginCheckout({
        transaction_id: data.payment_session_id,
        value: price,
        currency: currency,
        items: [
          {
            item_id: eventId,
            item_name: eventTitle,
            price: price,
            quantity: 1,
          },
        ],
      });

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
    pollCountRef.current = 0;

    // Poll every 5 seconds with max attempt limit
    pollIntervalRef.current = setInterval(() => {
      if (isPollingRef.current) {
        pollCountRef.current += 1;

        // Stop polling if max attempts reached
        if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
          stopPolling();
          setIsProcessing(false);
          logPaymentTimeout(eventId, price, currency);
          toast({
            title: "Payment verification timeout",
            description: "Please refresh the page to check your registration status.",
          });
          return;
        }

        verifyPayment(paymentSessionId);
      }
    }, 5000);

    // Also stop polling after 5 minutes as a backup
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
    // Block payment if payments are disabled
    if (!paymentsEnabled) {
      toast({
        title: "Payments temporarily disabled",
        description: "Payments are currently disabled. Please check back soon.",
        variant: "destructive",
      });
      return;
    }
    createPaymentMutation.mutate();
  };

  // Show disabled state when payments are disabled
  const isDisabled = createPaymentMutation.isPending || isProcessing || isLoadingSettings || !paymentsEnabled;

  return (
    <Button
      onClick={handlePayment}
      disabled={isDisabled}
      className={className}
    >
      {createPaymentMutation.isPending || isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {isProcessing ? 'Processing...' : 'Initializing...'}
        </>
      ) : isLoadingSettings ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : !paymentsEnabled ? (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Payments Disabled
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