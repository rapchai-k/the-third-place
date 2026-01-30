-- Migration: Add app_settings table and feature-flag the welcome email side-effect
-- Purpose: Allow local user creation without requiring extensions.http_post
-- The welcome email trigger is disabled by default (for local dev safety)
-- Set enable_welcome_email to 'true' in remote to enable welcome emails

-- 1) Create the app_settings table (safe to exist in all envs)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify app_settings
CREATE POLICY "Admins can manage app_settings"
ON public.app_settings
FOR ALL
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- Service role can access app_settings
CREATE POLICY "Service role can access app_settings"
ON public.app_settings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Add updated_at trigger for app_settings
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Insert the feature flag (defaults to 'false' for local safety)
-- In remote, you would run: UPDATE public.app_settings SET value = 'true' WHERE key = 'enable_welcome_email';
INSERT INTO public.app_settings(key, value)
VALUES ('enable_welcome_email', 'false')
ON CONFLICT (key) DO NOTHING;

-- 3) Update handle_new_user() to check the flag before calling extensions.http_post
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  welcome_email_enabled BOOLEAN;
BEGIN
  -- Insert user data
  INSERT INTO public.users (id, name, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  -- Insert notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  
  -- Check if welcome email is enabled via feature flag
  SELECT COALESCE(
    (SELECT value FROM public.app_settings WHERE key = 'enable_welcome_email'),
    'false'
  ) = 'true' INTO welcome_email_enabled;
  
  -- Short-circuit if welcome email is disabled (e.g., local environment)
  IF NOT welcome_email_enabled THEN
    RETURN NEW;
  END IF;
  
  -- Send welcome email asynchronously using the correct HTTP function signature
  -- This will only execute when enable_welcome_email = 'true'
  BEGIN
    PERFORM 
      extensions.http_post(
        'https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/send-welcome-email',
        jsonb_build_object(
          'userId', NEW.id,
          'userEmail', NEW.email,
          'userName', COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User')
        )::text,
        'application/json'
      );
  EXCEPTION
    WHEN OTHERS THEN
      -- If http_post fails, log the error but don't fail user creation
      -- This provides resilience even when extensions.http_post exists but fails
      INSERT INTO public.email_logs (recipient, subject, status, error_message)
      VALUES (
        NEW.email,
        'Welcome to The Third Place - Your Community Awaits!',
        'failed_trigger',
        'Failed to trigger welcome email: ' || SQLERRM
      );
  END;
  
  RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON TABLE public.app_settings IS 'Application-wide settings and feature flags';
COMMENT ON COLUMN public.app_settings.key IS 'Setting identifier (e.g., enable_welcome_email)';
COMMENT ON COLUMN public.app_settings.value IS 'Setting value (typically true/false for flags)';

