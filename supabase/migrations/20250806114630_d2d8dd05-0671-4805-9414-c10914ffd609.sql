-- First, check if users table already exists and create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Create users table with comprehensive profile data
        CREATE TABLE public.users (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            photo_url TEXT,
            role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
            referral_code TEXT UNIQUE,
            is_banned BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Enable RLS on users table
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies for users
        CREATE POLICY "Users can view their own profile"
        ON public.users
        FOR SELECT
        USING (auth.uid() = id);

        CREATE POLICY "Users can update their own profile"
        ON public.users
        FOR UPDATE
        USING (auth.uid() = id);

        CREATE POLICY "Admins can view all users"
        ON public.users
        FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        ));

        CREATE POLICY "Admins can update any user"
        ON public.users
        FOR UPDATE
        USING (EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        ));

        -- Create trigger for automatic user profile creation
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = ''
        AS $$
        BEGIN
            INSERT INTO public.users (id, name, email, photo_url)
            VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User'),
                NEW.email,
                NEW.raw_user_meta_data ->> 'avatar_url'
            );
            RETURN NEW;
        END;
        $$;

        -- Create trigger to run the function
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

        -- Create function to generate unique referral codes
        CREATE OR REPLACE FUNCTION public.generate_referral_code()
        RETURNS TEXT
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = ''
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

        -- Update users table to auto-generate referral codes
        UPDATE public.users 
        SET referral_code = generate_referral_code() 
        WHERE referral_code IS NULL;

        -- Create trigger to auto-generate referral codes for new users
        CREATE OR REPLACE FUNCTION public.set_referral_code()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        AS $$
        BEGIN
            IF NEW.referral_code IS NULL THEN
                NEW.referral_code := generate_referral_code();
            END IF;
            RETURN NEW;
        END;
        $$;

        CREATE TRIGGER set_user_referral_code
        BEFORE INSERT ON public.users
        FOR EACH ROW EXECUTE FUNCTION public.set_referral_code();

        -- Create notification preferences table
        CREATE TABLE public.notification_preferences (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            email_notifications BOOLEAN DEFAULT true,
            push_notifications BOOLEAN DEFAULT true,
            community_updates BOOLEAN DEFAULT true,
            event_reminders BOOLEAN DEFAULT true,
            discussion_notifications BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(user_id)
        );

        -- Enable RLS on notification preferences
        ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies for notification preferences
        CREATE POLICY "Users can view their own notification preferences"
        ON public.notification_preferences
        FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can update their own notification preferences"
        ON public.notification_preferences
        FOR UPDATE
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own notification preferences"
        ON public.notification_preferences
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        -- Update the new user handler to create notification preferences
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = ''
        AS $$
        BEGIN
            INSERT INTO public.users (id, name, email, photo_url)
            VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User'),
                NEW.email,
                NEW.raw_user_meta_data ->> 'avatar_url'
            );
            
            INSERT INTO public.notification_preferences (user_id)
            VALUES (NEW.id);
            
            RETURN NEW;
        END;
        $$;

    END IF;
END
$$;