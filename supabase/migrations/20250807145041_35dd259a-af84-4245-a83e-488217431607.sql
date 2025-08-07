-- Create webhook system tables and functions

-- Create webhook_configurations table
CREATE TABLE public.webhook_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on webhook_configurations
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;

-- Create webhook_deliveries table
CREATE TABLE public.webhook_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_config_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on webhook_deliveries
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for webhook_configurations
CREATE POLICY "Admins can manage webhook configurations" 
ON public.webhook_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Create RLS policies for webhook_deliveries
CREATE POLICY "Admins can view webhook deliveries" 
ON public.webhook_deliveries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_webhook_configurations_updated_at
  BEFORE UPDATE ON public.webhook_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to dispatch webhooks
CREATE OR REPLACE FUNCTION public.dispatch_webhook(
  event_type TEXT,
  event_data JSONB,
  actor_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  webhook_config RECORD;
  payload JSONB;
BEGIN
  -- Create the webhook payload
  payload := jsonb_build_object(
    'event', event_type,
    'timestamp', now(),
    'actor_user_id', actor_user_id,
    'data', event_data,
    'request_id', gen_random_uuid()
  );

  -- Insert webhook deliveries for all active configurations that subscribe to this event
  FOR webhook_config IN 
    SELECT id, url, secret_key 
    FROM public.webhook_configurations 
    WHERE is_active = true 
    AND event_type = ANY(events)
  LOOP
    INSERT INTO public.webhook_deliveries (
      webhook_config_id,
      event_type,
      payload,
      status
    ) VALUES (
      webhook_config.id,
      event_type,
      payload,
      'pending'
    );
  END LOOP;
END;
$$;