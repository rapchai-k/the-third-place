-- Migration: Add enable_payments feature flag to app_settings
-- Purpose: Allow disabling all new payment flows (Razorpay) while keeping free events working
-- Default: 'false' (payments disabled) for safe deployment

-- 1) Insert the enable_payments feature flag (defaults to 'false' for safe deployment)
-- To enable payments, run: UPDATE public.app_settings SET value = 'true' WHERE key = 'enable_payments';
INSERT INTO public.app_settings(key, value)
VALUES ('enable_payments', 'false')
ON CONFLICT (key) DO NOTHING;

-- 2) Add a public read policy for the enable_payments key
-- This allows the frontend to read this specific setting without authentication
-- while keeping other app_settings protected
CREATE POLICY "Anyone can read enable_payments setting"
ON public.app_settings
FOR SELECT
USING (key = 'enable_payments');

-- 3) Grant SELECT permission on app_settings to anon and authenticated roles
-- (RLS policy above will restrict which rows they can actually see)
GRANT SELECT ON public.app_settings TO anon, authenticated;

-- Add comment for documentation
COMMENT ON COLUMN public.app_settings.value IS 'Setting value (typically true/false for flags). enable_payments controls whether new paid registrations can be initiated.';

