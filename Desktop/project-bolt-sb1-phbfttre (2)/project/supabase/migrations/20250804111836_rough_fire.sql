/*
  # Update Partners Table Schema

  1. Schema Updates
    - Add all required columns from Excel data
    - Add partner_id as unique identifier
    - Add business and cooperation status fields
    - Add regional and capacity information
    - Add parent-child partner relationships

  2. Data Structure
    - partner_id: Unique identifier from Excel
    - partner_name: Company name
    - partner_city_id: City identifier
    - city: City name
    - cooperation_status: Status of cooperation
    - business_status: Business operational status
    - capacity_type: Type of capacity/service
    - parent_partner_id: For partner hierarchies
    - partner_company_name_en: English company name
    - brand_name: Brand identifier
    - signer_email: Signing authority email
    - legal_email: Legal contact email
    - manager_mis_ids: Manager identifiers
    - region: Regional classification

  3. Indexes
    - Add indexes for partner_id and region for performance
    - Add index for parent_partner_id for hierarchy queries
*/

-- Add new columns to partners table
DO $$
BEGIN
  -- Add partner_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE partners ADD COLUMN partner_id text UNIQUE;
  END IF;

  -- Add partner_name column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'partner_name'
  ) THEN
    ALTER TABLE partners ADD COLUMN partner_name text;
  END IF;

  -- Add partner_city_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'partner_city_id'
  ) THEN
    ALTER TABLE partners ADD COLUMN partner_city_id text;
  END IF;

  -- Add city column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'city'
  ) THEN
    ALTER TABLE partners ADD COLUMN city text;
  END IF;

  -- Add cooperation_status column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'cooperation_status'
  ) THEN
    ALTER TABLE partners ADD COLUMN cooperation_status text;
  END IF;

  -- Add business_status column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'business_status'
  ) THEN
    ALTER TABLE partners ADD COLUMN business_status text;
  END IF;

  -- Add capacity_type column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'capacity_type'
  ) THEN
    ALTER TABLE partners ADD COLUMN capacity_type text;
  END IF;

  -- Add parent_partner_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'parent_partner_id'
  ) THEN
    ALTER TABLE partners ADD COLUMN parent_partner_id text;
  END IF;

  -- Add partner_company_name_en column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'partner_company_name_en'
  ) THEN
    ALTER TABLE partners ADD COLUMN partner_company_name_en text;
  END IF;

  -- Add brand_name column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'brand_name'
  ) THEN
    ALTER TABLE partners ADD COLUMN brand_name text;
  END IF;

  -- Add signer_email column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'signer_email'
  ) THEN
    ALTER TABLE partners ADD COLUMN signer_email text;
  END IF;

  -- Add legal_email column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'legal_email'
  ) THEN
    ALTER TABLE partners ADD COLUMN legal_email text;
  END IF;

  -- Add manager_mis_ids column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'manager_mis_ids'
  ) THEN
    ALTER TABLE partners ADD COLUMN manager_mis_ids text;
  END IF;

  -- Add region column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'region'
  ) THEN
    ALTER TABLE partners ADD COLUMN region text;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_partner_id ON partners(partner_id);
CREATE INDEX IF NOT EXISTS idx_partners_region ON partners(region);
CREATE INDEX IF NOT EXISTS idx_partners_parent_partner_id ON partners(parent_partner_id);
CREATE INDEX IF NOT EXISTS idx_partners_cooperation_status ON partners(cooperation_status);
CREATE INDEX IF NOT EXISTS idx_partners_business_status ON partners(business_status);