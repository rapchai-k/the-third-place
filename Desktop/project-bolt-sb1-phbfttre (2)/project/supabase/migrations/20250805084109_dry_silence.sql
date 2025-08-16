/*
  # Fix Vendor User Role and Database Schema

  1. Database Changes
    - Add 'vendor' to allowed user roles
    - Add vendor_id field to users table
    - Fix vendor table constraints
    - Create proper policies

  2. Security
    - Vendors can only access their own data
    - Proper RLS policies for vendor access
*/

-- Step 1: Add vendor_id column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE users ADD COLUMN vendor_id text;
    CREATE INDEX IF NOT EXISTS idx_users_vendor_id ON users(vendor_id);
  END IF;
END $$;

-- Step 2: Update users role constraint to include vendor
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'training_person'::text, 'equipment_person'::text, 'vendor'::text]));

-- Step 3: Create vendor ID generation function if it doesn't exist
CREATE OR REPLACE FUNCTION generate_vendor_id()
RETURNS text AS $$
DECLARE
  next_id integer;
  vendor_id text;
BEGIN
  -- Get the next vendor number
  SELECT COALESCE(MAX(CAST(SUBSTRING(vendor_id FROM 4) AS integer)), 0) + 1
  INTO next_id
  FROM vendors
  WHERE vendor_id ~ '^VND[0-9]+$';
  
  -- Format as VND001, VND002, etc.
  vendor_id := 'VND' || LPAD(next_id::text, 3, '0');
  
  RETURN vendor_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger function for auto-generating vendor_id
CREATE OR REPLACE FUNCTION set_vendor_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.vendor_id IS NULL OR NEW.vendor_id = '' THEN
    NEW.vendor_id := generate_vendor_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_set_vendor_id ON vendors;
CREATE TRIGGER trigger_set_vendor_id
  BEFORE INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION set_vendor_id();

-- Step 6: Add foreign key constraint for users.vendor_id
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_vendor_id_fkey;
ALTER TABLE users ADD CONSTRAINT users_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE SET NULL;

-- Step 7: Create RLS policies for vendors
DROP POLICY IF EXISTS "Vendors can view own profile" ON users;
CREATE POLICY "Vendors can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (role = 'vendor' AND vendor_id IS NOT NULL AND 
     EXISTS (
       SELECT 1 FROM vendors 
       WHERE vendors.vendor_id = users.vendor_id 
       AND vendors.vendor_email = auth.email()
     ))
    OR role != 'vendor'
  );

DROP POLICY IF EXISTS "Vendors can update own profile" ON users;
CREATE POLICY "Vendors can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    (role = 'vendor' AND vendor_id IS NOT NULL AND 
     EXISTS (
       SELECT 1 FROM vendors 
       WHERE vendors.vendor_id = users.vendor_id 
       AND vendors.vendor_email = auth.email()
     ))
    OR role != 'vendor'
  );

-- Step 8: Insert sample vendors if table is empty
INSERT INTO vendors (vendor_name, vendor_email, location, boxes_per_hour, max_boxes_per_day, is_active, can_login)
SELECT * FROM (VALUES
  ('QuickBox Installations', 'quickbox@example.com', 'Dubai Marina', 3, 24, true, true),
  ('FastInstall Services', 'fastinstall@example.com', 'Business Bay', 2, 16, true, true),
  ('ProBox Solutions', 'probox@example.com', 'Jumeirah', 4, 32, true, true),
  ('BoxMaster UAE', 'boxmaster@example.com', 'Downtown Dubai', 2, 20, true, true),
  ('InstallPro Dubai', 'installpro@example.com', 'Al Barsha', 3, 18, true, true)
) AS v(vendor_name, vendor_email, location, boxes_per_hour, max_boxes_per_day, is_active, can_login)
WHERE NOT EXISTS (SELECT 1 FROM vendors LIMIT 1);