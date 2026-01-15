-- Safeguard migration to ensure email_logs table and welcome_email_sent_at column exist
-- and handle_new_user() triggers the welcome email

-- 1) Add welcome_email_sent_at to users if missing
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

-- 2) Create email_logs table if missing
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'resend',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Indexes (safe if not exists)
CREATE INDEX IF NOT EXISTS idx_users_welcome_email_sent_at ON public.users(welcome_email_sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- 4) Enable RLS (idempotent)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies (conditionally create)
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_logs' AND policyname = 'Service can insert email logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Service can insert email logs" ON public.email_logs FOR INSERT WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_logs' AND policyname = 'Service can update email logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Service can update email logs" ON public.email_logs FOR UPDATE USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_logs' AND policyname = 'Admins can view email logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view email logs" ON public.email_logs FOR SELECT USING (public.get_user_role() = ''admin'')';
  END IF;
END$policy$;

-- 6) updated_at trigger for email_logs (conditionally create)
DO $trigger$
DECLARE
  _relid oid;
BEGIN
  SELECT 'public.email_logs'::regclass::oid INTO _relid;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = _relid AND tgname = 'update_email_logs_updated_at'
  ) THEN
    EXECUTE '
      CREATE TRIGGER update_email_logs_updated_at
      BEFORE UPDATE ON public.email_logs
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()
    ';
  END IF;
END$trigger$;

-- 7) Comments (idempotent)
COMMENT ON TABLE public.email_logs IS 'Tracks email delivery status and metadata for all outbound emails';
COMMENT ON COLUMN public.users.welcome_email_sent_at IS 'Timestamp when welcome email was sent to prevent duplicates';

-- 8) Ensure handle_new_user() triggers welcome email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Extract user information
  user_name := COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User');
  user_email := NEW.email;

  -- Insert user profile
  INSERT INTO public.users (id, name, photo_url)
  VALUES (
    NEW.id,
    user_name,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  -- Insert notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  -- Trigger welcome email asynchronously (fire and forget)
  BEGIN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/welcome-email-trigger',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'userId', NEW.id::text,
        'userEmail', user_email,
        'userName', user_name
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- If pg_net is not available or fails, log the request for manual processing
      INSERT INTO public.email_logs (recipient, subject, status, error_message)
      VALUES (
        user_email,
        'Welcome to The Third Place - Your Community Awaits!',
        'pending_trigger',
        'Failed to trigger welcome email: ' || SQLERRM
      );
  END;
  
  RETURN NEW;
END;
$$;

-- 9) Helper to manually trigger welcome email if needed (idempotent replace)
CREATE OR REPLACE FUNCTION public.trigger_welcome_email(user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT u.id, u.name, au.email, u.welcome_email_sent_at
  INTO user_record
  FROM public.users u
  JOIN auth.users au ON u.id = au.id
  WHERE u.id = user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF user_record.welcome_email_sent_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Welcome email already sent');
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/welcome-email-trigger',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'userId', user_record.id::text,
        'userEmail', user_record.email,
        'userName', user_record.name
      )
    );

    RETURN jsonb_build_object('success', true, 'message', 'Welcome email triggered');
  EXCEPTION
    WHEN OTHERS THEN
      INSERT INTO public.email_logs (recipient, subject, status, error_message)
      VALUES (
        user_record.email,
        'Welcome to The Third Place - Your Community Awaits!',
        'failed_trigger',
        'Failed to trigger welcome email: ' || SQLERRM
      );

      RETURN jsonb_build_object('success', false, 'error', 'Failed to trigger welcome email: ' || SQLERRM);
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.trigger_welcome_email(UUID) TO authenticated;

