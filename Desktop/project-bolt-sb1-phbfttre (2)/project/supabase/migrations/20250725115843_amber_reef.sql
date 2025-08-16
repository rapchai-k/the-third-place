/*
  # Add column order to project schemas

  1. Schema Updates
    - Add column_order to project_schemas table to maintain file column order
    - Update existing records with default order

  2. Functions
    - Add helper functions for project-based operations
*/

-- Add column_order to project_schemas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_schemas' AND column_name = 'column_order'
  ) THEN
    ALTER TABLE project_schemas ADD COLUMN column_order integer DEFAULT 0;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_schemas_order 
ON project_schemas (project_id, table_name, column_order);

-- Function to get eligible riders for training (Car riders)
CREATE OR REPLACE FUNCTION get_eligible_car_riders_for_training(p_project_id uuid)
RETURNS TABLE (
  rider_data jsonb,
  rider_id text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pd.data,
    pd.data->>'rider_id' as rider_id
  FROM project_data pd
  WHERE pd.project_id = p_project_id
    AND pd.table_name = 'riders'
    AND (pd.data->>'audit_status' = 'Audit Pass' OR pd.data->>'job_status' = 'On Job')
    AND pd.data->>'delivery_type' = 'car'
    AND NOT EXISTS (
      SELECT 1 FROM project_data training
      WHERE training.project_id = p_project_id
        AND training.table_name = 'trainings'
        AND training.data->>'rider_id' = pd.data->>'rider_id'
        AND training.data->>'status' = 'completed'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get eligible riders for box installation (Bike riders)
CREATE OR REPLACE FUNCTION get_eligible_bike_riders_for_installation(p_project_id uuid)
RETURNS TABLE (
  rider_data jsonb,
  rider_id text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pd.data,
    pd.data->>'rider_id' as rider_id
  FROM project_data pd
  WHERE pd.project_id = p_project_id
    AND pd.table_name = 'riders'
    AND (pd.data->>'audit_status' = 'Audit Pass' OR pd.data->>'job_status' = 'On Job')
    AND pd.data->>'delivery_type' = 'bike'
    AND NOT EXISTS (
      SELECT 1 FROM project_data installation
      WHERE installation.project_id = p_project_id
        AND installation.table_name = 'box_installations'
        AND installation.data->>'rider_id' = pd.data->>'rider_id'
        AND installation.data->>'status' = 'completed'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get eligible riders for equipment distribution
CREATE OR REPLACE FUNCTION get_eligible_riders_for_equipment(p_project_id uuid)
RETURNS TABLE (
  rider_data jsonb,
  rider_id text,
  delivery_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pd.data,
    pd.data->>'rider_id' as rider_id,
    pd.data->>'delivery_type' as delivery_type
  FROM project_data pd
  WHERE pd.project_id = p_project_id
    AND pd.table_name = 'riders'
    AND (pd.data->>'audit_status' = 'Audit Pass' OR pd.data->>'job_status' = 'On Job')
    AND EXISTS (
      SELECT 1 FROM project_data training
      WHERE training.project_id = p_project_id
        AND training.table_name = 'trainings'
        AND training.data->>'rider_id' = pd.data->>'rider_id'
        AND training.data->>'status' = 'completed'
    )
    AND (
      pd.data->>'delivery_type' = 'car' 
      OR (
        pd.data->>'delivery_type' = 'bike' 
        AND EXISTS (
          SELECT 1 FROM project_data installation
          WHERE installation.project_id = p_project_id
            AND installation.table_name = 'box_installations'
            AND installation.data->>'rider_id' = pd.data->>'rider_id'
            AND installation.data->>'status' = 'completed'
        )
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM project_data equipment
      WHERE equipment.project_id = p_project_id
        AND equipment.table_name = 'equipment_distributions'
        AND equipment.data->>'rider_id' = pd.data->>'rider_id'
        AND equipment.data->>'status' = 'distributed'
    );
END;
$$ LANGUAGE plpgsql;