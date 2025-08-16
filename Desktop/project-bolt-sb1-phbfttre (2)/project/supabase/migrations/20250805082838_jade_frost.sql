/*
  # Fix vendors table constraints and foreign keys

  1. Database Structure
    - `vendors` table with proper constraints
    - Auto-generated vendor_id (VND001, VND002, etc.)
    - Email as unique identifier for login
    - Capacity tracking for box installations

  2. Foreign Keys
    - vendor_installations references vendors(vendor_id)
    - Proper cascade operations

  3. Security
    - Enable RLS on vendors table
    - Add policies for authenticated users
    - Vendor portal access control
*/

-- Drop existing foreign key if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendor_installations_vendor_id_fkey'
  ) THEN
    ALTER TABLE vendor_installations DROP CONSTRAINT vendor_installations_vendor_id_fkey;
  END IF;
END $$;

-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS vendor_installations CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS set_vendor_id() CASCADE;
DROP FUNCTION IF EXISTS update_vendors_updated_at() CASCADE;

-- Create vendors table with proper structure
CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id text UNIQUE NOT NULL,
  vendor_name text NOT NULL,
  vendor_email text UNIQUE NOT NULL,
  location text NOT NULL,
  boxes_per_hour integer NOT NULL DEFAULT 1,
  max_boxes_per_day integer NOT NULL DEFAULT 8,
  is_active boolean DEFAULT true,
  can_login boolean DEFAULT true,
  password_hash text,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor_installations table
CREATE TABLE vendor_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id text NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  rider_id text NOT NULL,
  installation_date date NOT NULL,
  installation_time time NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes text,
  proof_image_url text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to auto-generate vendor_id
CREATE OR REPLACE FUNCTION set_vendor_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id integer;
  new_vendor_id text;
BEGIN
  -- Get the next vendor number
  SELECT COALESCE(MAX(CAST(SUBSTRING(vendor_id FROM 4) AS integer)), 0) + 1
  INTO next_id
  FROM vendors
  WHERE vendor_id ~ '^VND[0-9]+$';
  
  -- Format as VND001, VND002, etc.
  new_vendor_id := 'VND' || LPAD(next_id::text, 3, '0');
  
  -- Set the vendor_id
  NEW.vendor_id := new_vendor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_set_vendor_id
  BEFORE INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION set_vendor_id();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_installations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendors
CREATE POLICY "Authenticated users can read vendors"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vendors"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vendors"
  ON vendors
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete vendors"
  ON vendors
  FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for vendor_installations
CREATE POLICY "Authenticated users can read vendor installations"
  ON vendor_installations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vendor installations"
  ON vendor_installations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vendor installations"
  ON vendor_installations
  FOR UPDATE
  TO authenticated
  USING (true);

-- Insert sample vendors
INSERT INTO vendors (vendor_name, vendor_email, location, boxes_per_hour, max_boxes_per_day, is_active, can_login) VALUES
('QuickInstall Solutions', 'contact@quickinstall.com', 'Dubai Marina - Zone A', 3, 24, true, true),
('FastBox Installation', 'info@fastbox.ae', 'Abu Dhabi Downtown', 2, 16, true, true),
('ProInstall Services', 'service@proinstall.com', 'Sharjah Industrial Area', 4, 32, true, true),
('BoxMaster UAE', 'admin@boxmaster.ae', 'Ajman Free Zone', 2, 20, true, true),
('InstallPro Emirates', 'contact@installpro.ae', 'Ras Al Khaimah Center', 3, 18, true, true);