-- Fix the handle_new_user function JSON syntax error
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Send welcome email asynchronously with proper JSON construction
  PERFORM 
    net.http_post(
      url := 'https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := jsonb_build_object(
        'userId', NEW.id,
        'userEmail', NEW.email,
        'userName', COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User')
      )
    );
  
  RETURN NEW;
END;
$function$;