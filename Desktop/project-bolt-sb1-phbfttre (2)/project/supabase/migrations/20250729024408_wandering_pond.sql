/*
  # Create Unified Rider System

  1. New Tables
    - `riders` - Unified rider data with rider_id as primary key
    - `upload_history` - Track all upload sessions
    - `rider_updates` - Track individual rider changes per upload
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
  
  3. Features
    - Smart upsert functionality
    - Upload session tracking
    - Change detection and logging
*/

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS project_data CASCADE;
DROP TABLE IF EXISTS project_schemas CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS equipment_distributions CASCADE;
DROP TABLE IF EXISTS box_installations CASCADE;
DROP TABLE IF EXISTS trainings CASCADE;
DROP TABLE IF EXISTS equipment_items CASCADE;
DROP TABLE IF EXISTS riders CASCADE;

-- Create unified riders table
CREATE TABLE riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id text UNIQUE NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_upload_id uuid
);

-- Create upload history table
CREATE TABLE upload_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  riders_created integer NOT NULL DEFAULT 0,
  riders_updated integer NOT NULL DEFAULT 0,
  columns_detected text[] NOT NULL DEFAULT '{}',
  upload_status text NOT NULL DEFAULT 'processing' CHECK (upload_status IN ('processing', 'completed', 'failed')),
  error_message text,
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create rider updates tracking table
CREATE TABLE rider_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES upload_history(id) ON DELETE CASCADE,
  rider_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'no_change')),
  changed_columns text[] DEFAULT '{}',
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_riders_rider_id ON riders(rider_id);
CREATE INDEX idx_riders_updated_at ON riders(updated_at);
CREATE INDEX idx_riders_data_gin ON riders USING gin(data);
CREATE INDEX idx_upload_history_created_at ON upload_history(created_at);
CREATE INDEX idx_upload_history_uploaded_by ON upload_history(uploaded_by);
CREATE INDEX idx_rider_updates_upload_id ON rider_updates(upload_id);
CREATE INDEX idx_rider_updates_rider_id ON rider_updates(rider_id);

-- Enable RLS
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view riders"
  ON riders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can modify riders"
  ON riders FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view upload history"
  ON upload_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create upload history"
  ON upload_history FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Authenticated users can update own uploads"
  ON upload_history FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Authenticated users can view rider updates"
  ON rider_updates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create rider updates"
  ON rider_updates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for riders table
CREATE TRIGGER update_riders_updated_at
  BEFORE UPDATE ON riders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for smart rider upsert
CREATE OR REPLACE FUNCTION upsert_rider_data(
  p_rider_id text,
  p_new_data jsonb,
  p_upload_id uuid
) RETURNS text AS $$
DECLARE
  existing_rider riders%ROWTYPE;
  changed_columns text[] := '{}';
  key text;
  action_taken text := 'no_change';
BEGIN
  -- Get existing rider
  SELECT * INTO existing_rider FROM riders WHERE rider_id = p_rider_id;
  
  IF existing_rider.id IS NULL THEN
    -- Create new rider
    INSERT INTO riders (rider_id, data, last_upload_id)
    VALUES (p_rider_id, p_new_data, p_upload_id);
    
    -- Log the creation
    INSERT INTO rider_updates (upload_id, rider_id, action, new_data)
    VALUES (p_upload_id, p_rider_id, 'created', p_new_data);
    
    action_taken := 'created';
  ELSE
    -- Check for changes
    FOR key IN SELECT jsonb_object_keys(p_new_data)
    LOOP
      IF (existing_rider.data->key) IS DISTINCT FROM (p_new_data->key) THEN
        changed_columns := array_append(changed_columns, key);
      END IF;
    END LOOP;
    
    -- Only update if there are changes
    IF array_length(changed_columns, 1) > 0 THEN
      UPDATE riders 
      SET data = existing_rider.data || p_new_data,
          last_upload_id = p_upload_id
      WHERE rider_id = p_rider_id;
      
      -- Log the update
      INSERT INTO rider_updates (upload_id, rider_id, action, changed_columns, old_data, new_data)
      VALUES (p_upload_id, p_rider_id, 'updated', changed_columns, existing_rider.data, p_new_data);
      
      action_taken := 'updated';
    ELSE
      -- Log no change
      INSERT INTO rider_updates (upload_id, rider_id, action)
      VALUES (p_upload_id, p_rider_id, 'no_change');
    END IF;
  END IF;
  
  RETURN action_taken;
END;
$$ LANGUAGE plpgsql;