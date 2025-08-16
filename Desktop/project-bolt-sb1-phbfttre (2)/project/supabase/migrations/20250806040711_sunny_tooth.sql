/*
  # Add vendor timing and availability columns

  1. New Columns
    - `serviceable_days` (text array) - Days vendor is available
    - `start_time` (time) - Daily start time
    - `end_time` (time) - Daily end time  
    - `break_start_time` (time) - Break start time
    - `break_end_time` (time) - Break end time
    - `timezone` (text) - Vendor timezone
    - `is_available_weekends` (boolean) - Weekend availability
    - `special_notes` (text) - Special timing notes

  2. Security
    - No RLS changes needed (inherits existing policies)
*/

-- Add serviceable days array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'serviceable_days'
  ) THEN
    ALTER TABLE vendors ADD COLUMN serviceable_days text[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  END IF;
END $$;

-- Add start time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN start_time time DEFAULT '08:00';
  END IF;
END $$;

-- Add end time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN end_time time DEFAULT '18:00';
  END IF;
END $$;

-- Add break start time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_start_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_start_time time;
  END IF;
END $$;

-- Add break end time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_end_time time;
  END IF;
END $$;

-- Add timezone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE vendors ADD COLUMN timezone text DEFAULT 'Asia/Qatar';
  END IF;
END $$;

-- Add weekend availability
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'is_available_weekends'
  ) THEN
    ALTER TABLE vendors ADD COLUMN is_available_weekends boolean DEFAULT false;
  END IF;
END $$;

-- Add special notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'special_notes'
  ) THEN
    ALTER TABLE vendors ADD COLUMN special_notes text;
  END IF;
END $$;