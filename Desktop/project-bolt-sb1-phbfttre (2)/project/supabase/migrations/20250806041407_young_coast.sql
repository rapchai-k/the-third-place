/*
  # Add Complete Vendor Timing and Availability Fields

  1. New Columns Added
    - `serviceable_days` (text array) - Working days of the week
    - `start_time` (time) - Daily start time
    - `end_time` (time) - Daily end time  
    - `break_start_time` (time) - Break start time (optional)
    - `break_end_time` (time) - Break end time (optional)
    - `timezone` (text) - Vendor timezone
    - `is_available_weekends` (boolean) - Weekend availability
    - `special_notes` (text) - Special timing notes

  2. Default Values
    - Working days: Monday to Saturday
    - Start time: 08:00
    - End time: 18:00
    - Timezone: Asia/Qatar
    - Weekend availability: false

  3. Security
    - Inherits existing RLS policies from vendors table
    - No additional security changes needed
*/

-- Add serviceable_days column (array of working days)
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

-- Add break_start_time column (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_start_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_start_time time;
  END IF;
END $$;

-- Add break_end_time column (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_end_time time;
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
    ALTER TABLE vendors ADD COLUMN is_available_weekends boolean DEFAULT false;
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

-- Update existing vendors with default values if they have null values
UPDATE vendors 
SET 
  serviceable_days = ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
WHERE serviceable_days IS NULL;

UPDATE vendors 
SET 
  start_time = '08:00'
WHERE start_time IS NULL;

UPDATE vendors 
SET 
  end_time = '18:00'
WHERE end_time IS NULL;

UPDATE vendors 
SET 
  timezone = 'Asia/Qatar'
WHERE timezone IS NULL;

UPDATE vendors 
SET 
  is_available_weekends = false
WHERE is_available_weekends IS NULL;