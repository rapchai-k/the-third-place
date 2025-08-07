import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";
import { useState } from "react";
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
  const { logPaymentInitiated, logPaymentCompleted } = useActivityLogger();

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
      pollPaymentStatus(data.payment_session_id);
      
      toast({
        title: "Redirecting to payment",
        description: "Please complete your payment in the new tab.",
      });
    },
    onError: (error) => {
      toast({
        title: "Payment initialization failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentSessionId: string) => {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { paymentSessionId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.payment_status === 'completed') {
        // Log successful payment
        logPaymentCompleted(eventId, price, currency, data.payment_id);
        
        toast({
          title: "Payment successful!",
          description: "You are now registered for the event.",
        });
        onPaymentSuccess?.();
      } else if (data.payment_status === 'failed') {
        toast({
          title: "Payment failed",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
      }
      setIsProcessing(false);
    },
    onError: () => {
      setIsProcessing(false);
    }
  });

  const pollPaymentStatus = (paymentSessionId: string) => {
    setIsProcessing(true);
    
    const pollInterval = setInterval(() => {
      verifyPaymentMutation.mutate(paymentSessionId);
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isProcessing) {
        setIsProcessing(false);
        toast({
          title: "Payment verification timeout",
          description: "Please refresh the page to check your registration status.",
          variant: "destructive",
        });
      }
    }, 300000);

    // Listen for tab focus to check payment status
    const handleFocus = () => {
      verifyPaymentMutation.mutate(paymentSessionId);
    };
    window.addEventListener('focus', handleFocus);

    // Cleanup function
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
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