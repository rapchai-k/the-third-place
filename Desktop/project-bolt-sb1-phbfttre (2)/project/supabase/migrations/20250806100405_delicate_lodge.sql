/*
  # Complete Vendors Table Schema Fix

  1. Missing Columns Added
    - serviceable_days (text array for working days)
    - start_time (time for daily start)
    - end_time (time for daily end)
    - break_start_time (time for break start)
    - break_end_time (time for break end)
    - timezone (text for vendor timezone)
    - is_available_weekends (boolean for weekend availability)
    - special_notes (text for special timing notes)

  2. Safe Migration
    - Uses IF NOT EXISTS to prevent errors
    - Adds sensible defaults for existing vendors
    - Preserves all existing vendor data
*/

-- Add serviceable_days column (array of working days)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'serviceable_days'
  ) THEN
    ALTER TABLE vendors ADD COLUMN serviceable_days text[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    RAISE NOTICE 'Added serviceable_days column to vendors table';
  ELSE
    RAISE NOTICE 'serviceable_days column already exists in vendors table';
  END IF;
END $$;

-- Add start_time column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN start_time time DEFAULT '08:00';
    RAISE NOTICE 'Added start_time column to vendors table';
  ELSE
    RAISE NOTICE 'start_time column already exists in vendors table';
  END IF;
END $$;

-- Add end_time column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN end_time time DEFAULT '18:00';
    RAISE NOTICE 'Added end_time column to vendors table';
  ELSE
    RAISE NOTICE 'end_time column already exists in vendors table';
  END IF;
END $$;

-- Add break_start_time column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_start_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_start_time time DEFAULT '12:00';
    RAISE NOTICE 'Added break_start_time column to vendors table';
  ELSE
    RAISE NOTICE 'break_start_time column already exists in vendors table';
  END IF;
END $$;

-- Add break_end_time column (THIS IS THE MISSING ONE!)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_end_time time DEFAULT '13:00';
    RAISE NOTICE 'Added break_end_time column to vendors table';
  ELSE
    RAISE NOTICE 'break_end_time column already exists in vendors table';
  END IF;
END $$;

-- Add timezone column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE vendors ADD COLUMN timezone text DEFAULT 'Asia/Qatar';
    RAISE NOTICE 'Added timezone column to vendors table';
  ELSE
    RAISE NOTICE 'timezone column already exists in vendors table';
  END IF;
END $$;

-- Add is_available_weekends column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'is_available_weekends'
  ) THEN
    ALTER TABLE vendors ADD COLUMN is_available_weekends boolean DEFAULT true;
    RAISE NOTICE 'Added is_available_weekends column to vendors table';
  ELSE
    RAISE NOTICE 'is_available_weekends column already exists in vendors table';
  END IF;
END $$;

-- Add special_notes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'special_notes'
  ) THEN
    ALTER TABLE vendors ADD COLUMN special_notes text;
    RAISE NOTICE 'Added special_notes column to vendors table';
  ELSE
    RAISE NOTICE 'special_notes column already exists in vendors table';
  END IF;
END $$;

-- Update existing vendors with default values if they have NULL values
UPDATE vendors 
SET 
  serviceable_days = COALESCE(serviceable_days, ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  start_time = COALESCE(start_time, '08:00'::time),
  end_time = COALESCE(end_time, '18:00'::time),
  break_start_time = COALESCE(break_start_time, '12:00'::time),
  break_end_time = COALESCE(break_end_time, '13:00'::time),
  timezone = COALESCE(timezone, 'Asia/Qatar'),
  is_available_weekends = COALESCE(is_available_weekends, true)
WHERE 
  serviceable_days IS NULL OR 
  start_time IS NULL OR 
  end_time IS NULL OR 
  break_start_time IS NULL OR 
  break_end_time IS NULL OR 
  timezone IS NULL OR 
  is_available_weekends IS NULL;