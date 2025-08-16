/*
  # Fix vendors table - Add all missing service hours columns

  1. New Columns
    - `serviceable_days` (text array, working days)
    - `start_time` (time, working start time)
    - `end_time` (time, working end time)
    - `break_start_time` (time, break start time)
    - `break_end_time` (time, break end time)
    - `timezone` (text, vendor timezone)
    - `is_available_weekends` (boolean, weekend availability)
    - `special_notes` (text, special timing notes)

  2. Data Updates
    - Set default values for existing vendors
    - Ensure all vendors have complete service hours data

  3. Safety
    - Uses IF NOT EXISTS to prevent errors
    - Preserves all existing vendor data
*/

-- Add serviceable_days column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'serviceable_days'
  ) THEN
    ALTER TABLE vendors ADD COLUMN serviceable_days text[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
  END IF;
END $$;

-- Add break_end_time column (THE MISSING ONE!)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_end_time time DEFAULT '13:00';
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
  END IF;
END $$;

-- Update existing vendors with default values for NULL fields
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