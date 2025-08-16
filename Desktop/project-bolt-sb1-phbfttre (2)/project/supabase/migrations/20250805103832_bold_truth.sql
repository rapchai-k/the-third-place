/*
  # Fix vendor_id generation using CTE approach

  1. Problem Fixed
    - Window functions not allowed in UPDATE statements
    - Ambiguous column reference "vendor_id"
  
  2. Solution
    - Use CTE (Common Table Expression) to compute ROW_NUMBER() first
    - Then UPDATE using the CTE results
    - Generate sequential vendor_id: VND001, VND002, etc.
  
  3. Security
    - No triggers needed - one-time fix for existing data
    - Simple, clean approach
*/

-- First, drop any existing problematic triggers and functions
DROP TRIGGER IF EXISTS trigger_set_vendor_id ON vendors;
DROP TRIGGER IF EXISTS set_vendor_id_trigger ON vendors;
DROP FUNCTION IF EXISTS set_vendor_id();
DROP FUNCTION IF EXISTS generate_vendor_id();
DROP FUNCTION IF EXISTS set_vendor_id_trigger();
DROP FUNCTION IF EXISTS generate_next_vendor_id();
DROP FUNCTION IF EXISTS set_vendor_id_on_insert();

-- Fix existing vendors that don't have vendor_id using CTE approach
WITH numbered_vendors AS (
  SELECT
    id,
    'VND' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0') AS new_vendor_id
  FROM
    vendors
  WHERE
    vendor_id IS NULL OR vendor_id = ''
)
UPDATE vendors
SET vendor_id = nv.new_vendor_id
FROM numbered_vendors nv
WHERE vendors.id = nv.id;

-- Create a simple function to generate the next vendor_id for new inserts
CREATE OR REPLACE FUNCTION generate_next_vendor_id()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Get the highest existing vendor number
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN vendor_id ~ '^VND[0-9]+$' 
        THEN CAST(SUBSTRING(vendor_id FROM 4) AS INTEGER)
        ELSE 0
      END
    ), 0
  ) + 1 INTO next_num
  FROM vendors;
  
  -- Return formatted vendor_id
  RETURN 'VND' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Create a simple trigger function that doesn't cause ambiguous references
CREATE OR REPLACE FUNCTION set_vendor_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set vendor_id if it's not already provided
  IF NEW.vendor_id IS NULL OR NEW.vendor_id = '' THEN
    NEW.vendor_id := generate_next_vendor_id();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for new vendor inserts
CREATE TRIGGER trigger_set_vendor_id
  BEFORE INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION set_vendor_id_on_insert();