/*
  # Fix vendors table constraints and foreign keys

  1. Updates
    - Fix vendor_id generation and constraints
    - Ensure proper foreign key references
    - Add sample vendor data with correct structure

  2. Security
    - Maintain RLS policies
    - Ensure proper access controls
*/

-- First, drop the problematic table if it exists
DROP TABLE IF EXISTS vendor_installations CASCADE;

-- Recreate vendors table with proper constraints
DROP TABLE IF EXISTS vendors CASCADE;

CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id text UNIQUE NOT NULL,
  vendor_name text NOT NULL,
  vendor_email text UNIQUE,
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

-- Create function to auto-generate vendor_id
CREATE OR REPLACE FUNCTION generate_vendor_id()
RETURNS text AS $$
DECLARE
  next_id integer;
  vendor_id_str text;
BEGIN
  -- Get the next vendor number
  SELECT COALESCE(MAX(CAST(SUBSTRING(vendor_id FROM 4) AS integer)), 0) + 1
  INTO next_id
  FROM vendors
  WHERE vendor_id ~ '^VND[0-9]+$';
  
  -- Format as VND001, VND002, etc.
  vendor_id_str := 'VND' || LPAD(next_id::text, 3, '0');
  
  RETURN vendor_id_str;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate vendor_id
CREATE OR REPLACE FUNCTION set_vendor_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.vendor_id IS NULL OR NEW.vendor_id = '' THEN
    NEW.vendor_id := generate_vendor_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_vendor_id
  BEFORE INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION set_vendor_id();

-- Create updated_at trigger function for vendors
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Now create vendor_installations table with proper foreign key
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

-- Enable RLS for vendor_installations
ALTER TABLE vendor_installations ENABLE ROW LEVEL SECURITY;

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

-- Insert sample vendors with auto-generated IDs
INSERT INTO vendors (vendor_name, vendor_email, location, boxes_per_hour, max_boxes_per_day, is_active, can_login) VALUES
('QuickInstall Solutions', 'contact@quickinstall.com', 'Dubai Marina', 3, 24, true, true),
('FastBox Installation', 'info@fastbox.ae', 'Business Bay', 2, 16, true, true),
('ProInstall Services', 'admin@proinstall.com', 'DIFC', 4, 32, true, true),
('BoxMaster UAE', 'support@boxmaster.ae', 'Jumeirah', 2, 20, true, true),
('InstallPro Dubai', 'hello@installpro.ae', 'Downtown Dubai', 3, 18, true, true);