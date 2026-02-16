-- Fix Referral System Migration
-- Addresses:
--   Bug 1: RLS blocks referral code lookup (new SECURITY DEFINER RPC)
--   Bug 2: Missing INSERT grant on referrals table
--   Bug 5: handle_new_user doesn't auto-generate referral codes

-- =============================================================================
-- Bug 2: Grant INSERT on referrals to authenticated users
-- =============================================================================
GRANT INSERT ON public.referrals TO authenticated;

-- =============================================================================
-- Bug 1: Create SECURITY DEFINER function to apply referral codes
-- This bypasses RLS so a new user can look up referrers by their referral_code
-- =============================================================================
CREATE OR REPLACE FUNCTION public.apply_referral_code(
  _referral_code TEXT,
  _new_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _referrer_id UUID;
  _already_referred UUID;
BEGIN
  -- Validate inputs
  IF _referral_code IS NULL OR _referral_code = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral code is required');
  END IF;

  IF _new_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
  END IF;

  -- Check if user has already been referred
  SELECT referred_by INTO _already_referred
  FROM public.users
  WHERE id = _new_user_id;

  IF _already_referred IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User has already been referred');
  END IF;

  -- Look up the referrer by referral code (bypasses RLS via SECURITY DEFINER)
  SELECT id INTO _referrer_id
  FROM public.users
  WHERE referral_code = upper(trim(_referral_code));

  IF _referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  -- Prevent self-referral
  IF _referrer_id = _new_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;

  -- Update the new user's referred_by field
  UPDATE public.users
  SET referred_by = _referrer_id
  WHERE id = _new_user_id;

  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_user_id)
  VALUES (_referrer_id, _new_user_id)
  ON CONFLICT (referred_user_id) DO NOTHING;

  -- Dispatch webhook event
  PERFORM public.dispatch_webhook(
    'user.referred_user',
    jsonb_build_object(
      'referred_user_id', _new_user_id,
      'referrer_id', _referrer_id,
      'referral_code', _referral_code
    ),
    _referrer_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', _referrer_id
  );
END;
$function$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.apply_referral_code(TEXT, UUID) TO authenticated;

-- =============================================================================
-- Bug 5: Update handle_new_user to auto-generate referral codes
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _referral_code TEXT;
BEGIN
  -- Generate a unique referral code for the new user
  _referral_code := public.generate_referral_code();

  -- Insert user data with auto-generated referral code
  INSERT INTO public.users (id, name, photo_url, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    _referral_code
  );
  
  -- Insert notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  
  -- Send welcome email asynchronously
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
  
  RETURN NEW;
END;
$function$;

-- Backfill: Generate referral codes for existing users who don't have one
UPDATE public.users
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

