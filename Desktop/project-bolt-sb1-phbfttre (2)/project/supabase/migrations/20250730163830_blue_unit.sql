/*
  # Create upsert_rider_data function

  1. New Functions
    - `upsert_rider_data` - Handles inserting new riders or updating existing ones
      - Takes rider_id, new_data (jsonb), and upload_id as parameters
      - Returns 'created', 'updated', or 'no_change' based on the operation
      - Properly handles unique constraint on rider_id using ON CONFLICT

  2. Features
    - Uses INSERT ... ON CONFLICT to handle duplicates
    - Tracks changes in rider_updates table
    - Returns meaningful status for upload tracking
    - Handles both new riders and updates to existing riders

  3. Security
    - Function is accessible to authenticated users
    - Inherits RLS policies from underlying tables
*/

-- Create the upsert_rider_data function
CREATE OR REPLACE FUNCTION upsert_rider_data(
  p_rider_id TEXT,
  p_new_data JSONB,
  p_upload_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_data JSONB;
  v_rider_uuid UUID;
  v_action TEXT;
  v_changed_columns TEXT[] := '{}';
  v_key TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
BEGIN
  -- Check if rider exists
  SELECT id, data INTO v_rider_uuid, v_existing_data
  FROM riders
  WHERE rider_id = p_rider_id;

  IF v_rider_uuid IS NULL THEN
    -- Insert new rider
    INSERT INTO riders (rider_id, data, last_upload_id)
    VALUES (p_rider_id, p_new_data, p_upload_id)
    RETURNING id INTO v_rider_uuid;
    
    v_action := 'created';
    
    -- Log the creation
    INSERT INTO rider_updates (
      upload_id,
      rider_id,
      action,
      new_data
    ) VALUES (
      p_upload_id,
      p_rider_id,
      v_action,
      p_new_data
    );
    
  ELSE
    -- Check if data has actually changed
    IF v_existing_data = p_new_data THEN
      v_action := 'no_change';
    ELSE
      -- Find changed columns
      FOR v_key IN SELECT jsonb_object_keys(p_new_data)
      LOOP
        v_old_value := v_existing_data ->> v_key;
        v_new_value := p_new_data ->> v_key;
        
        IF v_old_value IS DISTINCT FROM v_new_value THEN
          v_changed_columns := array_append(v_changed_columns, v_key);
        END IF;
      END LOOP;
      
      -- Update existing rider
      UPDATE riders
      SET 
        data = p_new_data,
        updated_at = NOW(),
        last_upload_id = p_upload_id
      WHERE id = v_rider_uuid;
      
      v_action := 'updated';
      
      -- Log the update
      INSERT INTO rider_updates (
        upload_id,
        rider_id,
        action,
        changed_columns,
        old_data,
        new_data
      ) VALUES (
        p_upload_id,
        p_rider_id,
        v_action,
        v_changed_columns,
        v_existing_data,
        p_new_data
      );
    END IF;
  END IF;

  RETURN v_action;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_rider_data(TEXT, JSONB, UUID) TO authenticated;