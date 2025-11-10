-- Migration to simplify event registration and payment status system
-- This migration:
-- 1. Creates new payment_status enum
-- 2. Adds payment_status column to payment_sessions table
-- 3. Updates registration_status enum values
-- 4. Migrates existing data to new status values

-- Step 1: Create new payment_status enum
CREATE TYPE payment_status AS ENUM ('yet_to_pay', 'paid');

-- Step 2: Add payment_status column to payment_sessions table
ALTER TABLE public.payment_sessions 
ADD COLUMN payment_status payment_status DEFAULT 'yet_to_pay';

-- Update existing payment_sessions based on current status
UPDATE public.payment_sessions
SET payment_status = CASE 
  WHEN status = 'completed' THEN 'paid'::payment_status
  ELSE 'yet_to_pay'::payment_status
END;

-- Step 3: Update registration_status enum
-- First, rename the old enum
ALTER TYPE registration_status RENAME TO registration_status_old;

-- Create new registration_status enum with simplified values
CREATE TYPE registration_status AS ENUM ('unregistered', 'registered');

-- Step 4: Migrate existing event_registrations data
-- Drop the default constraint first to avoid casting errors
ALTER TABLE public.event_registrations
ALTER COLUMN status DROP DEFAULT;

-- Update the status column to use the new enum
ALTER TABLE public.event_registrations
ALTER COLUMN status TYPE registration_status USING
CASE
  WHEN status::text IN ('success', 'pending') THEN 'registered'::registration_status
  ELSE 'unregistered'::registration_status
END;

-- Set new default value for future inserts
ALTER TABLE public.event_registrations
ALTER COLUMN status SET DEFAULT 'registered'::registration_status;

-- Step 5: Clean up old enum
DROP TYPE registration_status_old;

-- Add comment to document the changes
COMMENT ON COLUMN public.payment_sessions.payment_status IS 'Payment status: yet_to_pay (default) or paid (manually updated)';
COMMENT ON TYPE registration_status IS 'Simplified registration status: unregistered or registered';
COMMENT ON TYPE payment_status IS 'Payment status for paid events: yet_to_pay or paid';

