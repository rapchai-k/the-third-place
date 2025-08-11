-- Update the dispatch function to handle the existing schema correctly
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