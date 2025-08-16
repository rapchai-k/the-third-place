/*
  # Create vendors table for box installation management

  1. New Tables
    - `vendors`
      - `id` (uuid, primary key)
      - `vendor_id` (text, unique identifier)
      - `vendor_name` (text, company name)
      - `vendor_email` (text, contact email)
      - `location` (text, vendor location)
      - `boxes_per_hour` (integer, installation capacity per hour)
      - `max_boxes_per_day` (integer, maximum daily capacity)
      - `is_active` (boolean, vendor status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `vendors` table
    - Add policies for authenticated users to manage vendors
*/

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id text UNIQUE NOT NULL,
  vendor_name text NOT NULL,
  vendor_email text,
  location text NOT NULL,
  boxes_per_hour integer NOT NULL DEFAULT 1,
  max_boxes_per_day integer NOT NULL DEFAULT 8,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Policies for vendor management
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

-- Add some sample vendors
INSERT INTO vendors (vendor_id, vendor_name, vendor_email, location, boxes_per_hour, max_boxes_per_day, is_active) VALUES
('VND001', 'QuickInstall Solutions', 'contact@quickinstall.com', 'Dubai Marina', 3, 24, true),
('VND002', 'FastBox Installation', 'info@fastbox.ae', 'Abu Dhabi Downtown', 2, 16, true),
('VND003', 'ProInstall Services', 'support@proinstall.com', 'Sharjah Industrial Area', 4, 32, true),
('VND004', 'BoxMaster UAE', 'hello@boxmaster.ae', 'Ajman Free Zone', 2, 20, true),
('VND005', 'InstallPro Emirates', 'contact@installpro.ae', 'Ras Al Khaimah', 1, 10, true)
ON CONFLICT (vendor_id) DO NOTHING;