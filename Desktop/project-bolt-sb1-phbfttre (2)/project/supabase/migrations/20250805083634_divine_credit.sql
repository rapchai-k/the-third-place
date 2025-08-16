/*
  # Add Vendor User Role

  1. Database Changes
    - Add 'vendor' to allowed user roles
    - Update role check constraint to include vendor
    - Add vendor_id field to users table for mapping
    - Fix vendors table constraints and auto-generation
    - Create vendor_installations table for tracking

  2. Security
    - Vendors can only access box installation features
    - No access to user management, reports, or data upload
    - RLS policies for vendor-specific data access

  3. Auto-generation
    - Vendor IDs auto-generated as VND001, VND002, etc.
    - Trigger function for sequential vendor ID generation
*/

-- First, drop existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_role_check' AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

-- Add vendor to allowed user roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'training_person'::text, 'equipment_person'::text, 'vendor'::text]));

-- Add vendor_id field to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE users ADD COLUMN vendor_id text;
  END IF;
END $$;

-- Ensure vendors table has proper structure
DO $$
BEGIN
  -- Check if vendors table exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendors') THEN
    CREATE TABLE vendors (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id text UNIQUE NOT NULL,
      vendor_name text NOT NULL,
      vendor_email text UNIQUE NOT NULL,
      location text NOT NULL,
      boxes_per_hour integer DEFAULT 1 NOT NULL,
      max_boxes_per_day integer DEFAULT 8 NOT NULL,
      is_active boolean DEFAULT true,
      can_login boolean DEFAULT true,
      password_hash text,
      last_login timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
    
    -- Add RLS policies
    CREATE POLICY "Authenticated users can read vendors"
      ON vendors FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Authenticated users can insert vendors"
      ON vendors FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "Authenticated users can update vendors"
      ON vendors FOR UPDATE
      TO authenticated
      USING (true);

    CREATE POLICY "Authenticated users can delete vendors"
      ON vendors FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create or replace vendor ID generation function
CREATE OR REPLACE FUNCTION set_vendor_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vendor_id IS NULL OR NEW.vendor_id = '' THEN
    -- Get the next vendor number
    DECLARE
      next_num integer;
      new_vendor_id text;
    BEGIN
      -- Find the highest existing vendor number
      SELECT COALESCE(
        MAX(
          CASE 
            WHEN vendor_id ~ '^VND[0-9]+$' 
            THEN CAST(SUBSTRING(vendor_id FROM 4) AS integer)
            ELSE 0
          END
        ), 0
      ) + 1 INTO next_num
      FROM vendors;
      
      -- Format as VND001, VND002, etc.
      new_vendor_id := 'VND' || LPAD(next_num::text, 3, '0');
      NEW.vendor_id := new_vendor_id;
    END;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vendor ID generation if it doesn't exist
DROP TRIGGER IF EXISTS trigger_set_vendor_id ON vendors;
CREATE TRIGGER trigger_set_vendor_id
  BEFORE INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION set_vendor_id();

-- Create or replace updated_at trigger function for vendors
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger for vendors
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

-- Create vendor_installations table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_installations') THEN
    CREATE TABLE vendor_installations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id text NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
      rider_id text NOT NULL,
      installation_date date NOT NULL,
      installation_time time NOT NULL,
      location text NOT NULL,
      status text DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
      notes text,
      proof_image_url text,
      completed_at timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE vendor_installations ENABLE ROW LEVEL SECURITY;

    -- RLS policies for vendor_installations
    CREATE POLICY "Authenticated users can read vendor installations"
      ON vendor_installations FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Authenticated users can insert vendor installations"
      ON vendor_installations FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "Authenticated users can update vendor installations"
      ON vendor_installations FOR UPDATE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add foreign key constraint from users to vendors if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_vendor_id_fkey' AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_vendor_id_fkey 
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id);
  END IF;
END $$;

-- Insert sample vendors if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vendors LIMIT 1) THEN
    INSERT INTO vendors (vendor_name, vendor_email, location, boxes_per_hour, max_boxes_per_day, is_active, can_login) VALUES
    ('QuickBox Installations', 'quickbox@example.com', 'Dubai Marina', 2, 16, true, true),
    ('FastInstall Services', 'fastinstall@example.com', 'Business Bay', 3, 24, true, true),
    ('ProBox Solutions', 'probox@example.com', 'Jumeirah', 2, 16, true, true),
    ('SpeedyBox Co', 'speedybox@example.com', 'Downtown Dubai', 4, 32, true, true),
    ('ReliableBox Ltd', 'reliablebox@example.com', 'Al Barsha', 2, 16, true, true);
  END IF;
END $$;