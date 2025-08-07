import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, X } from 'lucide-react';
import { WebhookDelivery } from '@/hooks/useWebhooks';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface WebhookDeliveryDetailsProps {
  delivery: WebhookDelivery | null;
  open: boolean;
  onClose: () => void;
}

export const WebhookDeliveryDetails = ({ delivery, open, onClose }: WebhookDeliveryDetailsProps) => {
  const { toast } = useToast();

  if (!delivery) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(delivery.payload, null, 2));
    toast({
      title: "Copied",
      description: "Payload copied to clipboard",
    });
  };

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Webhook Delivery Details
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Event Type</Label>
                  <p className="font-mono text-sm">{delivery.event_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(delivery.status, delivery.attempts)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Attempts</Label>
                  <p className="text-sm">{delivery.attempts} / 3</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {delivery.last_attempt_at && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Attempt</Label>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(delivery.last_attempt_at), { addSuffix: true })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Details */}
          {(delivery.response_status || delivery.error_message) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {delivery.response_status && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">HTTP Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={delivery.response_status < 400 ? "default" : "destructive"}
                        className="font-mono"
                      >
                        {delivery.response_status}
                      </Badge>
                    </div>
                  </div>
                )}

                {delivery.response_body && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Response Body</Label>
                    <Textarea
                      value={delivery.response_body}
                      readOnly
                      className="mt-1 font-mono text-xs"
                      rows={6}
                    />
                  </div>
                )}

                {delivery.error_message && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Error Message</Label>
                    <div className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive font-mono">{delivery.error_message}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payload */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Payload</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopyPayload}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                value={JSON.stringify(delivery.payload, null, 2)}
                readOnly
                className="font-mono text-xs"
                rows={15}
              />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};