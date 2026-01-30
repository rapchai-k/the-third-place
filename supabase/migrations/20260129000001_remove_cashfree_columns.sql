-- Migration: Remove legacy Cashfree columns
-- Date: January 29, 2026
-- Description: Removes deprecated Cashfree payment gateway columns after migration to Razorpay
-- Note: All payments now use Razorpay. Cashfree was deprecated in January 2026.

-- Remove legacy Cashfree columns from payment_sessions
ALTER TABLE public.payment_sessions DROP COLUMN IF EXISTS cashfree_order_id;
ALTER TABLE public.payment_sessions DROP COLUMN IF EXISTS cashfree_payment_id;

-- Remove legacy Cashfree column from payment_logs
ALTER TABLE public.payment_logs DROP COLUMN IF EXISTS cashfree_signature;

-- Update default gateway to razorpay (in case it was still set to cashfree)
ALTER TABLE public.payment_sessions ALTER COLUMN gateway SET DEFAULT 'razorpay';

-- Remove the old Cashfree index (if it still exists)
DROP INDEX IF EXISTS idx_payment_sessions_cashfree_order_id;

-- Add comment documenting the cleanup
COMMENT ON TABLE public.payment_sessions IS 'Payment sessions for event registrations. Uses Razorpay Payment Links API.';

