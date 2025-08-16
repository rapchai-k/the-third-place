/*
  # Fix Vendor Window Function Error

  1. Database Changes
    - Remove window function from UPDATE statement
    - Use proper sequential numbering for existing vendors
    - Fix vendor_id generation trigger
    - Ensure all vendors have proper vendor_id values

  2. Security
    - Maintain existing RLS policies
    - Ensure proper vendor_id generation
*/

-- Drop existing trigger and function to recreate properly
DROP TRIGGER IF EXISTS trigger_set_vendor_id ON vendors;
DROP FUNCTION IF EXISTS generate_vendor_id();

-- Create simple vendor ID generation function
CREATE OR REPLACE FUNCTION generate_vendor_id()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    generated_id TEXT;
BEGIN
    -- Only set vendor_id if it's not already provided
    IF NEW.vendor_id IS NULL OR NEW.vendor_id = '' THEN
        -- Get the next sequence number by counting existing vendors
        SELECT COUNT(*) + 1
        INTO next_num
        FROM vendors
        WHERE vendor_id IS NOT NULL AND vendor_id != '';
        
        -- Generate the new vendor_id with proper formatting
        generated_id := 'VND' || LPAD(next_num::TEXT, 3, '0');
        
        -- Set the vendor_id on the NEW record
        NEW.vendor_id := generated_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_set_vendor_id
    BEFORE INSERT ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION generate_vendor_id();

-- Fix existing vendors without vendor_id using a simple approach
DO $$
DECLARE
    vendor_record RECORD;
    counter INTEGER := 1;
    new_id TEXT;
BEGIN
    -- Update vendors that don't have vendor_id set
    FOR vendor_record IN 
        SELECT id FROM vendors 
        WHERE vendor_id IS NULL OR vendor_id = ''
        ORDER BY created_at
    LOOP
        new_id := 'VND' || LPAD(counter::TEXT, 3, '0');
        
        UPDATE vendors 
        SET vendor_id = new_id 
        WHERE id = vendor_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Add sample vendors if none exist
INSERT INTO vendors (vendor_name, vendor_email, location, boxes_per_hour, max_boxes_per_day, is_active, can_login)
SELECT * FROM (VALUES
    ('QuickInstall Solutions', 'contact@quickinstall.com', 'Dubai Marina, Dubai', 3, 24, true, true),
    ('FastBox Installers', 'info@fastbox.ae', 'Business Bay, Dubai', 2, 16, true, true),
    ('ProInstall Services', 'team@proinstall.com', 'Al Barsha, Dubai', 4, 32, true, true),
    ('BoxMaster UAE', 'support@boxmaster.ae', 'Jumeirah Lake Towers, Dubai', 2, 20, true, false),
    ('InstallPro Dubai', 'hello@installpro.ae', 'Downtown Dubai', 3, 18, true, true)
) AS v(vendor_name, vendor_email, location, boxes_per_hour, max_boxes_per_day, is_active, can_login)
WHERE NOT EXISTS (
    SELECT 1 FROM vendors WHERE vendor_email = v.vendor_email
);