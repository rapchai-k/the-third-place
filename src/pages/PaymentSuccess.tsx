import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, CreditCard, Calendar, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  const { data: paymentData, isLoading, refetch } = useQuery({
    queryKey: ['payment-verification', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID provided');

      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { paymentSessionId: sessionId }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId
  });

  // Auto-refetch for pending payments
  useEffect(() => {
    if (paymentData?.payment_status === 'pending' && verificationAttempts < 20) {
      const timer = setTimeout(() => {
        refetch();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentData, verificationAttempts, refetch]);

  // Get event details
  const { data: eventDetails } = useQuery({
    queryKey: ['event-details', paymentData?.payment_session?.event_id],
    queryFn: async () => {
      if (!paymentData?.payment_session?.event_id) return null;

      const { data, error } = await supabase
        .from('events')
        .select('title, date_time, venue')
        .eq('id', paymentData.payment_session.event_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!paymentData?.payment_session?.event_id
  });

  useEffect(() => {
    if (paymentData && paymentData.payment_status === 'pending') {
      setVerificationAttempts(prev => prev + 1);
    }
  }, [paymentData]);

  if (!sessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-xl font-semibold mb-2">Invalid Payment Session</h1>
            <p className="text-muted-foreground mb-4">
              No payment session found. Please try registering again.
            </p>
            <Button asChild>
              <Link to="/events">Browse Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !paymentData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
            <Skeleton className="w-16 h-16 mx-auto rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStatusIcon = () => {
    switch (paymentData.payment_status) {
      case 'completed':
        return <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />;
      case 'failed':
        return <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />;
      default:
        return <Clock className="w-16 h-16 mx-auto mb-4 text-warning animate-pulse" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentData.payment_status) {
      case 'completed':
        return {
          title: "Payment Successful!",
          description: "Your registration has been confirmed. You will receive a confirmation email shortly."
        };
      case 'failed':
        return {
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try registering again."
        };
      default:
        return {
          title: "Processing Payment...",
          description: "We're verifying your payment. This may take a few moments."
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-6">
          {renderStatusIcon()}
          
          <div>
            <h2 className="text-xl font-semibold mb-2">{statusMessage.title}</h2>
            <p className="text-muted-foreground">{statusMessage.description}</p>
          </div>

          {eventDetails && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg">{eventDetails.title}</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {paymentData.payment_session.currency} {paymentData.payment_session.amount}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {new Date(eventDetails.date_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{eventDetails.venue}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 justify-center">
            {paymentData.payment_status === 'pending' && (
              <Button variant="outline" onClick={() => refetch()}>
                Check Status
              </Button>
            )}
            
            <Button asChild>
              <Link to={paymentData.payment_status === 'completed' ? '/profile' : '/events'}>
                {paymentData.payment_status === 'completed' ? 'View My Events' : 'Browse Events'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};