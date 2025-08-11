import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { CreditCard, Calendar, MapPin } from "lucide-react";

interface PaymentSession {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  events: {
    title: string;
    date_time: string;
    venue: string;
  } | null;
}

export const PaymentHistory = () => {
  const { user } = useAuth();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payment-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('payment_sessions')
        .select(`
          id,
          amount,
          currency,
          status,
          created_at,
          events (
            title,
            date_time,
            venue
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(item => ({
        ...item,
        events: Array.isArray(item.events) && item.events.length > 0 ? item.events[0] : null
      })) as PaymentSession[];
    },
    enabled: !!user
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'failed':
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to view your payment history.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Payment History</h2>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : payments?.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No payment history found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments?.map((payment) => (
            <Card key={payment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{payment.events?.title || 'Event'}</CardTitle>
                  <Badge className={getStatusColor(payment.status)}>
                    {getStatusText(payment.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {payment.currency} {payment.amount}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {payment.events?.date_time ? new Date(payment.events.date_time).toLocaleDateString() : 'Date TBD'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{payment.events?.venue || 'Venue TBD'}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  Payment made {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};