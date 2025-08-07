import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret_key?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_config_id: string;
  event_type: string;
  payload: any;
  status: string;
  attempts: number;
  last_attempt_at?: string;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  created_at: string;
}

export const useWebhooks = () => {
  const [configs, setConfigs] = useState<WebhookConfig[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching webhook configs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch webhook configurations",
        variant: "destructive",
      });
    }
  };

  const fetchDeliveries = async (configId?: string) => {
    try {
      let query = supabase
        .from('webhook_deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (configId) {
        query = query.eq('webhook_config_id', configId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching webhook deliveries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch webhook deliveries",
        variant: "destructive",
      });
    }
  };

  const createConfig = async (config: Omit<WebhookConfig, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('webhook_configurations')
        .insert({
          ...config,
          created_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Webhook configuration created successfully",
      });
      
      await fetchConfigs();
      return data;
    } catch (error) {
      console.error('Error creating webhook config:', error);
      toast({
        title: "Error",
        description: "Failed to create webhook configuration",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateConfig = async (id: string, updates: Partial<WebhookConfig>) => {
    try {
      const { error } = await supabase
        .from('webhook_configurations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Webhook configuration updated successfully",
      });
      
      await fetchConfigs();
    } catch (error) {
      console.error('Error updating webhook config:', error);
      toast({
        title: "Error",
        description: "Failed to update webhook configuration",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhook_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Webhook configuration deleted successfully",
      });
      
      await fetchConfigs();
    } catch (error) {
      console.error('Error deleting webhook config:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook configuration",
        variant: "destructive",
      });
      throw error;
    }
  };

  const testWebhook = async (configId: string) => {
    try {
      // Trigger a test webhook by dispatching a test event
      const { error } = await supabase.rpc('dispatch_webhook', {
        event_type: 'webhook.test',
        event_data: {
          test: true,
          timestamp: new Date().toISOString(),
          webhook_config_id: configId,
        },
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Test webhook dispatched successfully",
      });
      
      // Refresh deliveries to show the test
      setTimeout(() => fetchDeliveries(configId), 1000);
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Error",
        description: "Failed to test webhook",
        variant: "destructive",
      });
      throw error;
    }
  };

  const triggerDispatcher = async () => {
    try {
      const { error } = await supabase.functions.invoke('webhook-dispatcher');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Webhook dispatcher triggered successfully",
      });
      
      // Refresh deliveries
      setTimeout(() => fetchDeliveries(), 2000);
    } catch (error) {
      console.error('Error triggering dispatcher:', error);
      toast({
        title: "Error",
        description: "Failed to trigger webhook dispatcher",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConfigs(), fetchDeliveries()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    configs,
    deliveries,
    loading,
    fetchConfigs,
    fetchDeliveries,
    createConfig,
    updateConfig,
    deleteConfig,
    testWebhook,
    triggerDispatcher,
  };
};