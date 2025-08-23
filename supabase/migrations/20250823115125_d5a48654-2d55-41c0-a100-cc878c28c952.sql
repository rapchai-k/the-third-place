-- Fix the database trigger issue by ensuring proper extension setup
-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop and recreate the function with proper extension reference
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ensure the http extension is properly installed in the extensions schema
DROP EXTENSION IF EXISTS http;
CREATE EXTENSION IF NOT EXISTS http SCHEMA extensions;

-- Recreate the handle_new_user function with corrected extension reference
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
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
  
  -- Send welcome email asynchronously using the proper extensions schema
  PERFORM 
    extensions.http_post(
      'https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/send-welcome-email',
      jsonb_build_object(
        'userId', NEW.id,
        'userEmail', NEW.email,
        'userName', COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User')
      ),
      'application/json',
      jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      )
    );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();