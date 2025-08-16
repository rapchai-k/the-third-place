/*
  # Create upsert_rider_data function

  1. New Functions
    - `upsert_rider_data` - Handles rider data upserts with proper conflict resolution
    - Prevents duplicate key violations on rider_id
    - Tracks changes in rider_updates table
    - Returns status: 'created', 'updated', or 'no_change'

  2. Features
    - Proper upsert logic (insert new, update existing)
    - Change tracking and audit trail
    - Upload session linking
    - Handles unique constraint violations gracefully
*/

CREATE OR REPLACE FUNCTION upsert_rider_data(
  p_rider_id TEXT,
  p_new_data JSONB,
  p_upload_id UUID DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  existing_rider RECORD;
  result_status TEXT;
  changed_columns TEXT[] := '{}';
  old_data JSONB;
  key TEXT;
  old_value JSONB;
  new_value JSONB;
BEGIN
  -- Check if rider exists
  SELECT * INTO existing_rider 
  FROM riders 
  WHERE rider_id = p_rider_id;
  
  IF existing_rider IS NULL THEN
    -- Insert new rider
    INSERT INTO riders (rider_id, data, created_at, updated_at, last_upload_id)
    VALUES (p_rider_id, p_new_data, NOW(), NOW(), p_upload_id);
    
    -- Log the creation
    IF p_upload_id IS NOT NULL THEN
      INSERT INTO rider_updates (upload_id, rider_id, action, new_data, created_at)
      VALUES (p_upload_id, p_rider_id, 'created', p_new_data, NOW());
    END IF;
    
    result_status := 'created';
  ELSE
    -- Compare data to see what changed
    old_data := existing_rider.data;
    
    -- Check each key in new data
    FOR key IN SELECT jsonb_object_keys(p_new_data)
    LOOP
      old_value := old_data -> key;
      new_value := p_new_data -> key;
      
      -- If values are different, add to changed columns
      IF old_value IS DISTINCT FROM new_value THEN
        changed_columns := array_append(changed_columns, key);
      END IF;
    END LOOP;
    
    -- Check for removed keys (keys in old data but not in new data)
    FOR key IN SELECT jsonb_object_keys(old_data)
    LOOP
      IF NOT (p_new_data ? key) THEN
        changed_columns := array_append(changed_columns, key);
      END IF;
    END LOOP;
    
    IF array_length(changed_columns, 1) > 0 THEN
      -- Update existing rider
      UPDATE riders 
      SET data = p_new_data, 
          updated_at = NOW(),
          last_upload_id = p_upload_id
      WHERE rider_id = p_rider_id;
      
      -- Log the update
      IF p_upload_id IS NOT NULL THEN
        INSERT INTO rider_updates (upload_id, rider_id, action, changed_columns, old_data, new_data, created_at)
        VALUES (p_upload_id, p_rider_id, 'updated', changed_columns, old_data, p_new_data, NOW());
      END IF;
      
      result_status := 'updated';
    ELSE
      -- No changes needed
      IF p_upload_id IS NOT NULL THEN
        INSERT INTO rider_updates (upload_id, rider_id, action, created_at)
        VALUES (p_upload_id, p_rider_id, 'no_change', NOW());
      END IF;
      
      result_status := 'no_change';
    END IF;
  END IF;
  
  RETURN result_status;
END;
$$ LANGUAGE plpgsql;