/*
  # Fix Vendor Trigger and Window Function Errors

  1. Database Changes
    - Remove problematic trigger and function completely
    - Fix window function error in UPDATE statement
    - Use simple sequential approach for vendor_id generation
    - Handle existing vendors without vendor_id properly

  2. Security
    - Maintain existing RLS policies
    - Ensure proper vendor_id generation without conflicts
*/

-- Drop existing problematic trigger and function
DROP TRIGGER IF EXISTS trigger_set_vendor_id ON vendors;
DROP FUNCTION IF EXISTS set_vendor_id();
DROP FUNCTION IF EXISTS generate_vendor_id();

-- Create a simple and reliable vendor ID generation function
CREATE OR REPLACE FUNCTION generate_vendor_id()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    new_vendor_id TEXT;
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
    ) + 1
    INTO next_number
    FROM vendors;
    
    -- Generate new vendor_id
    new_vendor_id := 'VND' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_vendor_id;
END;
$$ LANGUAGE plpgsql;

-- Create simple trigger function without ambiguous references
CREATE OR REPLACE FUNCTION set_vendor_id_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set vendor_id if it's not already provided
    IF NEW.vendor_id IS NULL OR NEW.vendor_id = '' THEN
        NEW.vendor_id := generate_vendor_id();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    new_id TEXT;
BEGIN
    -- Get the current max vendor number
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN vendor_id ~ '^VND[0-9]+$' 
                THEN CAST(SUBSTRING(vendor_id FROM 4) AS INTEGER)
                ELSE 0
            END
        ), 0
    ) + 1
    INTO counter
    FROM vendors;
    
    -- Update vendors without vendor_id one by one
    FOR vendor_record IN 
        SELECT id FROM vendors WHERE vendor_id IS NULL OR vendor_id = ''
        ORDER BY created_at
    LOOP
        new_id := 'VND' || LPAD(counter::TEXT, 3, '0');
        
        UPDATE vendors 
        SET vendor_id = new_id 
        WHERE id = vendor_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;