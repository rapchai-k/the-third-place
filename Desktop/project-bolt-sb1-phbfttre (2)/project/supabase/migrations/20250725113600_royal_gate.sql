/*
  # Dynamic Project Schema System

  1. New Tables
    - `project_schemas` - Store dynamic column definitions for each project
    - `project_data` - Store actual data with JSONB for flexible columns
    - Update existing tables to support dynamic schemas

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create project_schemas table to store dynamic column definitions
CREATE TABLE IF NOT EXISTS project_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  column_name text NOT NULL,
  column_type text NOT NULL DEFAULT 'text',
  is_required boolean DEFAULT false,
  is_filterable boolean DEFAULT true,
  display_name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, table_name, column_name)
);

-- Create project_data table for flexible data storage
CREATE TABLE IF NOT EXISTS project_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_schemas_project_id ON project_schemas(project_id);
CREATE INDEX IF NOT EXISTS idx_project_schemas_table_name ON project_schemas(project_id, table_name);
CREATE INDEX IF NOT EXISTS idx_project_data_project_id ON project_data(project_id);
CREATE INDEX IF NOT EXISTS idx_project_data_table_name ON project_data(project_id, table_name);
CREATE INDEX IF NOT EXISTS idx_project_data_data ON project_data USING gin(data);

-- Enable RLS
ALTER TABLE project_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view project schemas"
  ON project_schemas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can modify project schemas"
  ON project_schemas
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view project data"
  ON project_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can modify project data"
  ON project_data
  FOR ALL
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_project_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_data_updated_at
  BEFORE UPDATE ON project_data
  FOR EACH ROW
  EXECUTE FUNCTION update_project_data_updated_at();