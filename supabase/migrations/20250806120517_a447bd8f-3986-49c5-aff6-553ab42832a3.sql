-- Create user_role enum
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Create registration_status enum
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Create users table (extends auth.users with additional profile data)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.users(id),
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email BOOLEAN NOT NULL DEFAULT true,
  sms BOOLEAN NOT NULL DEFAULT false,
  whatsapp BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile and admins can view all" 
ON public.users 
FOR SELECT 
USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "Users can update own profile and admins can update all" 
ON public.users 
FOR UPDATE 
USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "Service can insert users" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can delete users" 
ON public.users 
FOR DELETE 
USING (get_user_role() = 'admin');

-- RLS Policies for notification_preferences table
CREATE POLICY "Users can view own preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Service can insert preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (true);

-- Function to get user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT COUNT(*) INTO exists_check FROM public.users WHERE referral_code = code;
    
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, name, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically create user profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();