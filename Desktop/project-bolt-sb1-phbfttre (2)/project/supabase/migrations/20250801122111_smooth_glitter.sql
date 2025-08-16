/*
  # Create partners table for installation management

  1. New Tables
    - `partners`
      - `id` (uuid, primary key)
      - `name` (text, partner company name)
      - `location` (text, partner location/address)
      - `email` (text, contact email)
      - `phone` (text, contact phone number)
      - `is_active` (boolean, whether partner is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `partners` table
    - Add policies for authenticated users to read and manage partners

  3. Indexes
    - Add index on name for faster searches
    - Add index on is_active for filtering
*/

CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  email text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read partners"
  ON partners
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert partners"
  ON partners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update partners"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete partners"
  ON partners
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();