/*
  # Clean Vendor Setup

  1. New Functions
    - `get_next_vendor_number()` - Gets next sequential number for vendor ID
    - `set_vendor_id_trigger()` - Sets vendor_id on insert if missing

  2. Trigger
    - Automatically generates vendor_id in format VND001, VND002, etc.
    - Only runs on INSERT when vendor_id is NULL

  3. Data Cleanup
    - Updates existing vendors without vendor_id
*/

-- Drop existing problematic functions and triggers
DROP TRIGGER IF EXISTS trigger_set_vendor_id ON vendors;
DROP FUNCTION IF EXISTS set_vendor_id();
DROP FUNCTION IF EXISTS generate_vendor_id();
DROP FUNCTION IF EXISTS generate_next_vendor_id();
DROP FUNCTION IF EXISTS set_vendor_id_on_insert();

-- Simple function to get next vendor number
CREATE OR REPLACE FUNCTION get_next_vendor_number()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
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
    
    RETURN next_num;
END;
$$;

-- Simple trigger function to set vendor_id
CREATE OR REPLACE FUNCTION set_vendor_id_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Only set vendor_id if it's NULL
    IF NEW.vendor_id IS NULL THEN
        next_number := get_next_vendor_number();
        NEW.vendor_id := 'VND' || LPAD(next_number::TEXT, 3, '0');
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trigger_set_vendor_id
    BEFORE INSERT ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION set_vendor_id_trigger();

-- Fix existing vendors without vendor_id using a simple approach
DO $$
DECLARE
    vendor_record RECORD;
    counter INTEGER := 1;
BEGIN
    -- Update vendors that don't have vendor_id
    FOR vendor_record IN 
        SELECT id FROM vendors WHERE vendor_id IS NULL ORDER BY created_at
    LOOP
        -- Find next available number
        WHILE EXISTS (SELECT 1 FROM vendors WHERE vendor_id = 'VND' || LPAD(counter::TEXT, 3, '0')) LOOP
            counter := counter + 1;
        END LOOP;
        
        -- Update this vendor
        UPDATE vendors 
        SET vendor_id = 'VND' || LPAD(counter::TEXT, 3, '0')
        WHERE id = vendor_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;