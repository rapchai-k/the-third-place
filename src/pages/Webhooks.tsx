import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, TestTube, Play, Eye } from 'lucide-react';
import { useWebhooks, WebhookConfig, WebhookDelivery } from '@/hooks/useWebhooks';
import { WebhookConfigForm } from '@/components/webhooks/WebhookConfigForm';
import { WebhookDeliveryTable } from '@/components/webhooks/WebhookDeliveryTable';
import { WebhookDeliveryDetails } from '@/components/webhooks/WebhookDeliveryDetails';
import { formatDistanceToNow } from 'date-fns';

export default function Webhooks() {
  const { 
    configs, 
    deliveries, 
    loading, 
    createConfig, 
    updateConfig, 
    deleteConfig, 
    testWebhook,
    triggerDispatcher,
    fetchDeliveries
  } = useWebhooks();

  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<WebhookConfig | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  const [processingActions, setProcessingActions] = useState<Record<string, boolean>>({});

  const handleCreateConfig = async (configData: Omit<WebhookConfig, 'id' | 'created_at' | 'updated_at'>) => {
    await createConfig(configData);
    setShowConfigForm(false);
  };

  const handleUpdateConfig = async (configData: Omit<WebhookConfig, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingConfig) return;
    await updateConfig(editingConfig.id, configData);
    setEditingConfig(null);
  };

  const handleTestWebhook = async (configId: string) => {
    setProcessingActions(prev => ({ ...prev, [configId]: true }));
    try {
      await testWebhook(configId);
    } finally {
      setProcessingActions(prev => ({ ...prev, [configId]: false }));
    }
  };

  const handleTriggerDispatcher = async () => {
    setProcessingActions(prev => ({ ...prev, dispatcher: true }));
    try {
      await triggerDispatcher();
    } finally {
      setProcessingActions(prev => ({ ...prev, dispatcher: false }));
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhook Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure and monitor webhook endpoints for real-time event notifications
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleTriggerDispatcher}
            disabled={processingActions.dispatcher}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Process Queue
          </Button>
          <Dialog open={showConfigForm} onOpenChange={setShowConfigForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Webhook Configuration</DialogTitle>
              </DialogHeader>
              <WebhookConfigForm
                onSubmit={handleCreateConfig}
                onCancel={() => setShowConfigForm(false)}
                loading={loading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Webhook Configurations */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configurations</CardTitle>
          <CardDescription>
            Manage your webhook endpoints and event subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No webhook configurations found</p>
              <Button onClick={() => setShowConfigForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Webhook
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell className="font-mono text-sm max-w-xs truncate">
                        {config.url}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {config.events.length} events
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.is_active ? "default" : "secondary"}>
                          {config.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(config.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestWebhook(config.id)}
                            disabled={processingActions[config.id]}
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingConfig(config)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Webhook Configuration</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{config.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteConfig(config.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Deliveries */}
      <WebhookDeliveryTable
        deliveries={deliveries}
        onViewDetails={setSelectedDelivery}
        onRefresh={fetchDeliveries}
        loading={loading}
      />

      {/* Edit Configuration Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Webhook Configuration</DialogTitle>
          </DialogHeader>
          {editingConfig && (
            <WebhookConfigForm
              config={editingConfig}
              onSubmit={handleUpdateConfig}
              onCancel={() => setEditingConfig(null)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delivery Details Dialog */}
      <WebhookDeliveryDetails
        delivery={selectedDelivery}
        open={!!selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
      />
    </div>
  );
}