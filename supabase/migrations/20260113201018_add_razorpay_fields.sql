-- Add Razorpay-specific fields to payment_sessions table
-- This migration adds support for Razorpay Payment Links while preserving existing Cashfree data

-- Add Razorpay fields
ALTER TABLE public.payment_sessions 
ADD COLUMN razorpay_payment_link_id TEXT,
ADD COLUMN razorpay_payment_id TEXT,
ADD COLUMN gateway TEXT DEFAULT 'cashfree';

-- Create indexes for new fields
CREATE INDEX idx_payment_sessions_razorpay_link_id ON public.payment_sessions(razorpay_payment_link_id);
CREATE INDEX idx_payment_sessions_gateway ON public.payment_sessions(gateway);

-- Update existing records to mark them as Cashfree
UPDATE public.payment_sessions SET gateway = 'cashfree' WHERE gateway IS NULL;

-- Make gateway field NOT NULL after backfill
ALTER TABLE public.payment_sessions ALTER COLUMN gateway SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.payment_sessions.razorpay_payment_link_id IS 'Razorpay Payment Link ID for Razorpay payments';
COMMENT ON COLUMN public.payment_sessions.razorpay_payment_id IS 'Razorpay Payment ID after successful payment';
COMMENT ON COLUMN public.payment_sessions.gateway IS 'Payment gateway used: cashfree or razorpay';

