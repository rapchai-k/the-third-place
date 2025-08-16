/*
  # Add Vendor Serviceable Timings

  1. New Columns
    - `serviceable_days` (text array) - Days of the week vendor is available
    - `start_time` (time) - Daily start time
    - `end_time` (time) - Daily end time
    - `break_start_time` (time) - Break start time (optional)
    - `break_end_time` (time) - Break end time (optional)
    - `timezone` (text) - Vendor's timezone (default: Asia/Qatar)
    - `is_available_weekends` (boolean) - Weekend availability
    - `special_notes` (text) - Special timing notes

  2. Updates
    - Add timing columns to vendors table
    - Set default values for existing vendors
    - Add constraints for valid time ranges

  3. Security
    - Existing RLS policies will apply to new columns
*/

-- Add serviceable timing columns to vendors table
DO $$
BEGIN
  -- Add serviceable days (array of weekday names)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'serviceable_days'
  ) THEN
    ALTER TABLE vendors ADD COLUMN serviceable_days text[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  END IF;

  -- Add start time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN start_time time DEFAULT '08:00:00';
  END IF;

  -- Add end time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN end_time time DEFAULT '18:00:00';
  END IF;

  -- Add break start time (optional)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_start_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_start_time time DEFAULT '12:00:00';
  END IF;

  -- Add break end time (optional)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_end_time time DEFAULT '13:00:00';
  END IF;

  -- Add timezone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE vendors ADD COLUMN timezone text DEFAULT 'Asia/Qatar';
  END IF;

  -- Add weekend availability
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'is_available_weekends'
  ) THEN
    ALTER TABLE vendors ADD COLUMN is_available_weekends boolean DEFAULT false;
  END IF;

  -- Add special notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'special_notes'
  ) THEN
    ALTER TABLE vendors ADD COLUMN special_notes text;
  END IF;
END $$;

-- Add constraints for valid time ranges
DO $$
BEGIN
  -- Ensure end time is after start time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'vendors' AND constraint_name = 'vendors_valid_work_hours'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_valid_work_hours 
    CHECK (end_time > start_time);
  END IF;

  -- Ensure break times are within work hours (if specified)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'vendors' AND constraint_name = 'vendors_valid_break_times'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_valid_break_times 
    CHECK (
      (break_start_time IS NULL AND break_end_time IS NULL) OR
      (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND 
       break_start_time >= start_time AND break_end_time <= end_time AND 
       break_end_time > break_start_time)
    );
  END IF;
END $$;

-- Update existing vendors with default serviceable timings
UPDATE vendors 
SET 
  serviceable_days = ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  start_time = '08:00:00',
  end_time = '18:00:00',
  break_start_time = '12:00:00',
  break_end_time = '13:00:00',
  timezone = 'Asia/Qatar',
  is_available_weekends = false,
  special_notes = 'Standard working hours - Monday to Saturday'
WHERE 
  serviceable_days IS NULL OR 
  start_time IS NULL OR 
  end_time IS NULL;