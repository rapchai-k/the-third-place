import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WebhookConfig } from '@/hooks/useWebhooks';

const AVAILABLE_EVENTS = [
  'user.joined_platform',
  'user.joined_community',
  'user.registered_event',
  'user.cancelled_registration',
  'user.posted_comment',
  'user.flagged_comment',
  'user.referred_user',
  'discussion.auto_closed',
  'discussion.extended',
  'webhook.test'
];

interface WebhookConfigFormProps {
  config?: WebhookConfig;
  onSubmit: (config: Omit<WebhookConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const WebhookConfigForm = ({ config, onSubmit, onCancel, loading }: WebhookConfigFormProps) => {
  const [formData, setFormData] = useState({
    name: config?.name || '',
    url: config?.url || '',
    events: config?.events || [],
    secret_key: config?.secret_key || '',
    is_active: config?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleEventToggle = (event: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      events: checked 
        ? [...prev.events, event]
        : prev.events.filter(e => e !== event)
    }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{config ? 'Edit Webhook Configuration' : 'Create Webhook Configuration'}</CardTitle>
        <CardDescription>
          Configure a webhook endpoint to receive real-time notifications about events in your application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Webhook Configuration"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Webhook URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://your-app.com/webhooks"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret_key">Secret Key (Optional)</Label>
            <Input
              id="secret_key"
              type="password"
              value={formData.secret_key}
              onChange={(e) => setFormData(prev => ({ ...prev, secret_key: e.target.value }))}
              placeholder="Used to verify webhook authenticity"
            />
            <p className="text-sm text-muted-foreground">
              If provided, webhooks will include an HMAC-SHA256 signature in the X-Webhook-Signature header.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Events to Subscribe To</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_EVENTS.map((event) => (
                <div key={event} className="flex items-center space-x-2">
                  <Checkbox
                    id={event}
                    checked={formData.events.includes(event)}
                    onCheckedChange={(checked) => handleEventToggle(event, checked as boolean)}
                  />
                  <Label htmlFor={event} className="text-sm font-mono">
                    {event}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading || formData.events.length === 0}>
              {config ? 'Update' : 'Create'} Configuration
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};