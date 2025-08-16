/*
  # Add Vendor Serviceable Timings

  1. New Columns Added to vendors table
    - `serviceable_days` (text array) - Days of the week vendor is available
    - `start_time` (time) - Daily start time for installations
    - `end_time` (time) - Daily end time for installations
    - `break_start_time` (time) - Optional break start time
    - `break_end_time` (time) - Optional break end time
    - `timezone` (text) - Vendor's timezone for scheduling
    - `is_available_weekends` (boolean) - Weekend availability flag
    - `special_notes` (text) - Special timing notes or restrictions

  2. Default Values
    - serviceable_days: Monday to Saturday
    - start_time: 08:00
    - end_time: 18:00
    - timezone: Asia/Qatar
    - is_available_weekends: false

  3. Purpose
    - Enable capacity-based scheduling
    - Track vendor working hours
    - Manage installation timing conflicts
    - Support timezone-aware scheduling
*/

-- Add serviceable timing columns to vendors table
DO $$
BEGIN
  -- Add serviceable_days column (array of working days)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'serviceable_days'
  ) THEN
    ALTER TABLE vendors ADD COLUMN serviceable_days text[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  END IF;

  -- Add start_time column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN start_time time DEFAULT '08:00';
  END IF;

  -- Add end_time column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN end_time time DEFAULT '18:00';
  END IF;

  -- Add break_start_time column (optional)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_start_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_start_time time;
  END IF;

  -- Add break_end_time column (optional)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_end_time time;
  END IF;

  -- Add timezone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE vendors ADD COLUMN timezone text DEFAULT 'Asia/Qatar';
  END IF;

  -- Add is_available_weekends column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'is_available_weekends'
  ) THEN
    ALTER TABLE vendors ADD COLUMN is_available_weekends boolean DEFAULT false;
  END IF;

  -- Add special_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'special_notes'
  ) THEN
    ALTER TABLE vendors ADD COLUMN special_notes text;
  END IF;
END $$;

-- Update existing vendors with default values if they have NULL values
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_serviceable_days ON vendors USING GIN (serviceable_days);
CREATE INDEX IF NOT EXISTS idx_vendors_start_time ON vendors (start_time);
CREATE INDEX IF NOT EXISTS idx_vendors_end_time ON vendors (end_time);
CREATE INDEX IF NOT EXISTS idx_vendors_timezone ON vendors (timezone);
CREATE INDEX IF NOT EXISTS idx_vendors_is_available_weekends ON vendors (is_available_weekends);

-- Add constraints for data validation
DO $$
BEGIN
  -- Ensure start_time is before end_time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vendors_time_range_check'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_time_range_check 
    CHECK (start_time < end_time);
  END IF;

  -- Ensure break times are within working hours (if both are set)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vendors_break_time_check'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_break_time_check 
    CHECK (
      (break_start_time IS NULL AND break_end_time IS NULL) OR
      (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND 
       break_start_time >= start_time AND break_end_time <= end_time AND
       break_start_time < break_end_time)
    );
  END IF;

  -- Ensure timezone is valid
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vendors_timezone_check'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_timezone_check 
    CHECK (timezone IN ('Asia/Qatar', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kuwait', 'Asia/Bahrain'));
  END IF;
END $$;