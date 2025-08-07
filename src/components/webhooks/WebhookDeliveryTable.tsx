import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, RefreshCw } from 'lucide-react';
import { WebhookDelivery } from '@/hooks/useWebhooks';
import { formatDistanceToNow } from 'date-fns';

interface WebhookDeliveryTableProps {
  deliveries: WebhookDelivery[];
  onViewDetails: (delivery: WebhookDelivery) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const WebhookDeliveryTable = ({ 
  deliveries, 
  onViewDetails, 
  onRefresh, 
  loading 
}: WebhookDeliveryTableProps) => {
  const getStatusBadge = (status: string, attempts: number) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending ({attempts}/3)</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Webhook Deliveries</CardTitle>
          <CardDescription>
            Recent webhook delivery attempts and their status
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {deliveries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No webhook deliveries found
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Last Attempt</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-sm">
                      {delivery.event_type}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(delivery.status, delivery.attempts)}
                    </TableCell>
                    <TableCell>
                      {delivery.response_status ? (
                        <Badge 
                          variant={delivery.response_status < 400 ? "default" : "destructive"}
                          className="font-mono"
                        >
                          {delivery.response_status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {delivery.last_attempt_at ? 
                        formatDistanceToNow(new Date(delivery.last_attempt_at), { addSuffix: true }) :
                        'Never'
                      }
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(delivery)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};