-- Migration to extend payment_status enum with additional values
-- This adds: 'failed', 'expired', 'cancelled', 'refunded' to handle complete payment lifecycle
--
-- Current values: 'yet_to_pay', 'paid'
-- New values: 'yet_to_pay', 'paid', 'failed', 'expired', 'cancelled', 'refunded'

-- Add new enum values to payment_status
-- PostgreSQL allows adding values to existing enums with ALTER TYPE
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'failed';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'refunded';

-- Update comment to document all values
COMMENT ON TYPE payment_status IS 'Payment status lifecycle: yet_to_pay (initial), paid (success), failed (payment failed), expired (link expired), cancelled (user cancelled), refunded (payment refunded)';

-- Note: Existing data remains unchanged. The new values will be used by:
-- 1. Edge functions when payment fails or expires
-- 2. Cancel registration flow when user cancels a paid registration
-- 3. Future refund functionality

