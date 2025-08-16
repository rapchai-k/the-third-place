/*
  # Complete Vendors Table Fix

  1. Missing Columns Added
    - serviceable_days (text array for working days)
    - start_time (time for daily start)
    - end_time (time for daily end)
    - break_start_time (time for break start)
    - break_end_time (time for break end)
    - timezone (text for vendor timezone)
    - is_available_weekends (boolean for weekend availability)
    - special_notes (text for special timing notes)

  2. Data Integrity
    - All existing vendor data preserved
    - Sensible defaults for new columns
    - No data loss during migration

  3. Form Compatibility
    - All form fields now have corresponding database columns
    - Add and edit forms will work properly
*/

-- Add serviceable_days column if it doesn't exist
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

-- Add start_time column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN start_time time DEFAULT '08:00:00';
    RAISE NOTICE 'Added start_time column to vendors table';
  ELSE
    RAISE NOTICE 'start_time column already exists in vendors table';
  END IF;
END $$;

-- Add end_time column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN end_time time DEFAULT '18:00:00';
    RAISE NOTICE 'Added end_time column to vendors table';
  ELSE
    RAISE NOTICE 'end_time column already exists in vendors table';
  END IF;
END $$;

-- Add break_start_time column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_start_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_start_time time DEFAULT '12:00:00';
    RAISE NOTICE 'Added break_start_time column to vendors table';
  ELSE
    RAISE NOTICE 'break_start_time column already exists in vendors table';
  END IF;
END $$;

-- Add break_end_time column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'break_end_time'
  ) THEN
    ALTER TABLE vendors ADD COLUMN break_end_time time DEFAULT '13:00:00';
    RAISE NOTICE 'Added break_end_time column to vendors table';
  ELSE
    RAISE NOTICE 'break_end_time column already exists in vendors table';
  END IF;
END $$;

-- Add timezone column if it doesn't exist
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

-- Add is_available_weekends column if it doesn't exist
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

-- Add special_notes column if it doesn't exist
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

-- Update existing vendors with default values for new columns (only if they are null)
UPDATE vendors 
SET 
  serviceable_days = COALESCE(serviceable_days, ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  start_time = COALESCE(start_time, '08:00:00'::time),
  end_time = COALESCE(end_time, '18:00:00'::time),
  break_start_time = COALESCE(break_start_time, '12:00:00'::time),
  break_end_time = COALESCE(break_end_time, '13:00:00'::time),
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

-- Verify the table structure
DO $$
DECLARE
  column_count integer;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'vendors' AND table_schema = 'public';
  
  RAISE NOTICE 'Vendors table now has % columns', column_count;
  
  -- List all columns for verification
  FOR rec IN (
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'vendors' AND table_schema = 'public'
    ORDER BY ordinal_position
  ) LOOP
    RAISE NOTICE 'Column: % (%) - Nullable: % - Default: %', 
      rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
  END LOOP;
END $$;