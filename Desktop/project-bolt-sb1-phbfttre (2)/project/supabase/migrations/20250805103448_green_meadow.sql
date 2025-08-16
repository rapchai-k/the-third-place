/*
  # Clean Vendor Setup - No Window Functions

  1. Remove problematic triggers
  2. Create simple vendor_id generation
  3. Fix existing vendors without complex SQL
*/

-- Drop existing problematic triggers and functions
DROP TRIGGER IF EXISTS trigger_set_vendor_id ON vendors;
DROP FUNCTION IF EXISTS set_vendor_id();
DROP FUNCTION IF EXISTS generate_vendor_id();
DROP FUNCTION IF EXISTS generate_next_vendor_id();
DROP FUNCTION IF EXISTS set_vendor_id_on_insert();
DROP FUNCTION IF EXISTS set_vendor_id_trigger();

-- Simple function to get next vendor number
CREATE OR REPLACE FUNCTION get_next_vendor_number()
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(vendor_id FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM vendors 
  WHERE vendor_id ~ '^VND[0-9]+$';
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Simple trigger function
CREATE OR REPLACE FUNCTION assign_vendor_id()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  IF NEW.vendor_id IS NULL OR NEW.vendor_id = '' THEN
    next_number := get_next_vendor_number();
    NEW.vendor_id := 'VND' || LPAD(next_number::TEXT, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER set_vendor_id_before_insert
  BEFORE INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION assign_vendor_id();

-- Fix existing vendors without vendor_id using simple approach
DO $$
DECLARE
  vendor_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR vendor_record IN 
    SELECT id FROM vendors WHERE vendor_id IS NULL OR vendor_id = ''
    ORDER BY created_at
  LOOP
    UPDATE vendors 
    SET vendor_id = 'VND' || LPAD(counter::TEXT, 3, '0')
    WHERE id = vendor_record.id;
    
    counter := counter + 1;
  END LOOP;
END $$;