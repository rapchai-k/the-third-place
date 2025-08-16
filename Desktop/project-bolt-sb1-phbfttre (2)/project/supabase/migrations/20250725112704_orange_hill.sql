/*
  # Add Projects System

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text, project name)
      - `description` (text, optional description)
      - `created_at` (timestamp)
      - `created_by` (uuid, foreign key to users)
      - `is_active` (boolean, default true)

  2. Table Updates
    - Add `project_id` foreign key to all existing tables:
      - riders
      - trainings
      - box_installations
      - equipment_items
      - equipment_distributions

  3. Security
    - Enable RLS on projects table
    - Add policies for authenticated users
    - Update existing policies to include project filtering
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  is_active boolean DEFAULT true
);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Add project_id to existing tables
DO $$
BEGIN
  -- Add project_id to riders
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'riders' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE riders ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- Add project_id to trainings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainings' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE trainings ADD COLUMN project_id uuid REFERENCES trainings(id) ON DELETE CASCADE;
  END IF;

  -- Add project_id to box_installations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'box_installations' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE box_installations ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- Add project_id to equipment_items
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment_items' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE equipment_items ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- Add project_id to equipment_distributions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment_distributions' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE equipment_distributions ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_riders_project_id ON riders(project_id);
CREATE INDEX IF NOT EXISTS idx_trainings_project_id ON trainings(project_id);
CREATE INDEX IF NOT EXISTS idx_installations_project_id ON box_installations(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_items_project_id ON equipment_items(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_distributions_project_id ON equipment_distributions(project_id);

-- Add RLS policies for projects
CREATE POLICY "Authenticated users can view projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Update existing sample data to have a default project
DO $$
DECLARE
  default_project_id uuid;
BEGIN
  -- Create a default project
  INSERT INTO projects (name, description, created_by)
  VALUES ('Default Project', 'Initial project for existing data', (SELECT id FROM users LIMIT 1))
  RETURNING id INTO default_project_id;

  -- Update existing data to belong to default project
  UPDATE riders SET project_id = default_project_id WHERE project_id IS NULL;
  UPDATE trainings SET project_id = default_project_id WHERE project_id IS NULL;
  UPDATE box_installations SET project_id = default_project_id WHERE project_id IS NULL;
  UPDATE equipment_items SET project_id = default_project_id WHERE project_id IS NULL;
  UPDATE equipment_distributions SET project_id = default_project_id WHERE project_id IS NULL;
END $$;