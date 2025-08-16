/*
  # Create equipment_items table

  1. New Tables
    - `equipment_items`
      - `id` (uuid, primary key)
      - `name` (text, equipment name)
      - `category` (text, equipment category)
      - `sizes` (text array, available sizes)
      - `current_price` (numeric, current price)
      - `is_chargeable` (boolean, whether item is chargeable)
      - `is_active` (boolean, whether item is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `equipment_items` table
    - Add policies for authenticated users to perform CRUD operations

  3. Triggers
    - Add trigger to automatically update `updated_at` timestamp
*/

-- Create equipment_items table
CREATE TABLE IF NOT EXISTS public.equipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  sizes text[] DEFAULT ARRAY['One Size']::text[],
  current_price numeric(10,2) NOT NULL,
  is_chargeable boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.equipment_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users to read equipment_items"
  ON public.equipment_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert equipment_items"
  ON public.equipment_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update equipment_items"
  ON public.equipment_items
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete equipment_items"
  ON public.equipment_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_equipment_items_updated_at
  BEFORE UPDATE ON public.equipment_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();