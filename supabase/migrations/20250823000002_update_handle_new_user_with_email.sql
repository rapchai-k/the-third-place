-- Update handle_new_user function to trigger welcome emails
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
  -- This uses pg_net extension if available, otherwise logs for manual processing
  BEGIN
    -- Try to call the welcome email function via HTTP
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

-- Create a function to manually trigger welcome emails for users who haven't received them
CREATE OR REPLACE FUNCTION public.trigger_welcome_email(user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  result jsonb;
BEGIN
  -- Get user information
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

  -- Try to trigger welcome email
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
      -- Log the failed attempt
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

-- Grant execute permission to authenticated users for the manual trigger function
GRANT EXECUTE ON FUNCTION public.trigger_welcome_email(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user creation and triggers welcome email';
COMMENT ON FUNCTION public.trigger_welcome_email(UUID) IS 'Manually triggers welcome email for a specific user';
