/*
  # Fix Vendor ID Generation and Remove Auto-Generation

  1. Fix existing vendors with missing vendor_id using CTE approach
  2. Remove auto-generation trigger to simplify vendor creation
  3. Make vendor_id manually entered field
*/

-- First, fix existing vendors using CTE approach (no window functions in UPDATE)
WITH ranked_vendors AS (
  SELECT
    id,
    'VND' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0') AS new_vendor_id
  FROM vendors
  WHERE vendor_id IS NULL OR vendor_id = ''
)
UPDATE vendors
SET vendor_id = ranked_vendors.new_vendor_id
FROM ranked_vendors
WHERE vendors.id = ranked_vendors.id;

-- Drop the problematic trigger that was causing window function errors
DROP TRIGGER IF EXISTS trigger_set_vendor_id ON vendors;

-- Drop the problematic function
DROP FUNCTION IF EXISTS set_vendor_id();
DROP FUNCTION IF EXISTS generate_vendor_id();
DROP FUNCTION IF EXISTS generate_next_vendor_id();
DROP FUNCTION IF EXISTS set_vendor_id_trigger();

-- Make vendor_id a required field that must be manually entered
-- Remove the auto-generation and let users enter their own vendor IDs
ALTER TABLE vendors ALTER COLUMN vendor_id SET NOT NULL;

-- Add a simple check constraint to ensure vendor_id follows a pattern (optional)
ALTER TABLE vendors ADD CONSTRAINT vendor_id_format_check 
CHECK (vendor_id ~ '^[A-Z0-9]{3,10}$');

-- Update the vendors table comment
COMMENT ON TABLE vendors IS 'Box installation vendors - vendor_id must be manually entered (e.g., VND001, ABC123, etc.)';
COMMENT ON COLUMN vendors.vendor_id IS 'Unique vendor identifier - must be manually entered (3-10 uppercase alphanumeric characters)';