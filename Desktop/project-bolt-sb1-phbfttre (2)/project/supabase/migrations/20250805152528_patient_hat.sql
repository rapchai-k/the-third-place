/*
  # Enhanced Rider Upsert Function with Status Preservation

  1. New Function
    - `upsert_rider_data_preserve_status` - Smart upsert that preserves scheduled/completed status
    
  2. Protection Logic
    - Preserves Training Status if "Scheduled" or "Completed"
    - Preserves Box Installation if "Scheduled" or "Completed" 
    - Preserves Equipment Status if "Scheduled" or "Completed"
    - Only updates status fields if current value is "Eligible" or "Not Eligible"
    
  3. Data Preservation
    - Keeps all scheduling information (dates, times, locations)
    - Preserves completion information (completion dates, completed by)
    - Maintains vendor assignments and equipment allocations
    - Updates other rider data normally
*/

CREATE OR REPLACE FUNCTION upsert_rider_data_preserve_status(
  p_rider_id TEXT,
  p_new_data JSONB,
  p_upload_id UUID
) RETURNS TEXT AS $$
DECLARE
  existing_rider RECORD;
  final_data JSONB;
  action_taken TEXT;
  preserved_fields JSONB := '{}';
BEGIN
  -- Check if rider exists
  SELECT * INTO existing_rider 
  FROM riders 
  WHERE rider_id = p_rider_id;
  
  IF existing_rider IS NULL THEN
    -- New rider - apply eligibility logic normally
    INSERT INTO riders (rider_id, data, created_at, updated_at, last_upload_id)
    VALUES (p_rider_id, p_new_data, NOW(), NOW(), p_upload_id);
    
    -- Log the creation
    INSERT INTO rider_updates (upload_id, rider_id, action, changed_columns, new_data, created_at)
    VALUES (p_upload_id, p_rider_id, 'created', ARRAY(SELECT jsonb_object_keys(p_new_data)), p_new_data, NOW());
    
    RETURN 'created';
  ELSE
    -- Existing rider - preserve scheduled/completed status
    final_data := p_new_data;
    
    -- PRESERVE TRAINING STATUS AND DATA
    IF (existing_rider.data->>'training_status') IN ('Scheduled', 'Completed') THEN
      -- Preserve training status and all related data
      preserved_fields := preserved_fields || jsonb_build_object('training_status', existing_rider.data->>'training_status');
      final_data := final_data || jsonb_build_object('training_status', existing_rider.data->>'training_status');
      
      -- Preserve training scheduling data
      IF existing_rider.data ? 'training_scheduled_date' THEN
        preserved_fields := preserved_fields || jsonb_build_object('training_scheduled_date', existing_rider.data->>'training_scheduled_date');
        final_data := final_data || jsonb_build_object('training_scheduled_date', existing_rider.data->>'training_scheduled_date');
      END IF;
      
      IF existing_rider.data ? 'training_scheduled_time' THEN
        preserved_fields := preserved_fields || jsonb_build_object('training_scheduled_time', existing_rider.data->>'training_scheduled_time');
        final_data := final_data || jsonb_build_object('training_scheduled_time', existing_rider.data->>'training_scheduled_time');
      END IF;
      
      IF existing_rider.data ? 'training_location' THEN
        preserved_fields := preserved_fields || jsonb_build_object('training_location', existing_rider.data->>'training_location');
        final_data := final_data || jsonb_build_object('training_location', existing_rider.data->>'training_location');
      END IF;
      
      -- Preserve training completion data
      IF existing_rider.data ? 'training_completion_date' THEN
        preserved_fields := preserved_fields || jsonb_build_object('training_completion_date', existing_rider.data->>'training_completion_date');
        final_data := final_data || jsonb_build_object('training_completion_date', existing_rider.data->>'training_completion_date');
      END IF;
      
      IF existing_rider.data ? 'training_completion_time' THEN
        preserved_fields := preserved_fields || jsonb_build_object('training_completion_time', existing_rider.data->>'training_completion_time');
        final_data := final_data || jsonb_build_object('training_completion_time', existing_rider.data->>'training_completion_time');
      END IF;
      
      IF existing_rider.data ? 'training_completed_by' THEN
        preserved_fields := preserved_fields || jsonb_build_object('training_completed_by', existing_rider.data->>'training_completed_by');
        final_data := final_data || jsonb_build_object('training_completed_by', existing_rider.data->>'training_completed_by');
      END IF;
    END IF;
    
    -- PRESERVE BOX INSTALLATION STATUS AND DATA
    IF (existing_rider.data->>'box_installation') IN ('Scheduled', 'Completed') THEN
      -- Preserve installation status and all related data
      preserved_fields := preserved_fields || jsonb_build_object('box_installation', existing_rider.data->>'box_installation');
      final_data := final_data || jsonb_build_object('box_installation', existing_rider.data->>'box_installation');
      
      -- Preserve installation scheduling data
      IF existing_rider.data ? 'installation_scheduled_date' THEN
        preserved_fields := preserved_fields || jsonb_build_object('installation_scheduled_date', existing_rider.data->>'installation_scheduled_date');
        final_data := final_data || jsonb_build_object('installation_scheduled_date', existing_rider.data->>'installation_scheduled_date');
      END IF;
      
      IF existing_rider.data ? 'installation_scheduled_time' THEN
        preserved_fields := preserved_fields || jsonb_build_object('installation_scheduled_time', existing_rider.data->>'installation_scheduled_time');
        final_data := final_data || jsonb_build_object('installation_scheduled_time', existing_rider.data->>'installation_scheduled_time');
      END IF;
      
      IF existing_rider.data ? 'installation_location' THEN
        preserved_fields := preserved_fields || jsonb_build_object('installation_location', existing_rider.data->>'installation_location');
        final_data := final_data || jsonb_build_object('installation_location', existing_rider.data->>'installation_location');
      END IF;
      
      IF existing_rider.data ? 'installation_vendor_id' THEN
        preserved_fields := preserved_fields || jsonb_build_object('installation_vendor_id', existing_rider.data->>'installation_vendor_id');
        final_data := final_data || jsonb_build_object('installation_vendor_id', existing_rider.data->>'installation_vendor_id');
      END IF;
      
      -- Preserve installation completion data
      IF existing_rider.data ? 'installation_completion_date' THEN
        preserved_fields := preserved_fields || jsonb_build_object('installation_completion_date', existing_rider.data->>'installation_completion_date');
        final_data := final_data || jsonb_build_object('installation_completion_date', existing_rider.data->>'installation_completion_date');
      END IF;
      
      IF existing_rider.data ? 'installation_completion_time' THEN
        preserved_fields := preserved_fields || jsonb_build_object('installation_completion_time', existing_rider.data->>'installation_completion_time');
        final_data := final_data || jsonb_build_object('installation_completion_time', existing_rider.data->>'installation_completion_time');
      END IF;
      
      IF existing_rider.data ? 'installation_completed_by' THEN
        preserved_fields := preserved_fields || jsonb_build_object('installation_completed_by', existing_rider.data->>'installation_completed_by');
        final_data := final_data || jsonb_build_object('installation_completed_by', existing_rider.data->>'installation_completed_by');
      END IF;
      
      IF existing_rider.data ? 'installation_proof_image' THEN
        preserved_fields := preserved_fields || jsonb_build_object('installation_proof_image', existing_rider.data->>'installation_proof_image');
        final_data := final_data || jsonb_build_object('installation_proof_image', existing_rider.data->>'installation_proof_image');
      END IF;
      
      IF existing_rider.data ? 'installation_notes' THEN
        preserved_fields := preserved_fields || jsonb_build_object('installation_notes', existing_rider.data->>'installation_notes');
        final_data := final_data || jsonb_build_object('installation_notes', existing_rider.data->>'installation_notes');
      END IF;
    END IF;
    
    -- PRESERVE EQUIPMENT STATUS AND DATA
    IF (existing_rider.data->>'equipment_status') IN ('Scheduled', 'Completed') THEN
      -- Preserve equipment status and all related data
      preserved_fields := preserved_fields || jsonb_build_object('equipment_status', existing_rider.data->>'equipment_status');
      final_data := final_data || jsonb_build_object('equipment_status', existing_rider.data->>'equipment_status');
      
      -- Preserve equipment scheduling data
      IF existing_rider.data ? 'equipment_scheduled_date' THEN
        preserved_fields := preserved_fields || jsonb_build_object('equipment_scheduled_date', existing_rider.data->>'equipment_scheduled_date');
        final_data := final_data || jsonb_build_object('equipment_scheduled_date', existing_rider.data->>'equipment_scheduled_date');
      END IF;
      
      IF existing_rider.data ? 'equipment_scheduled_time' THEN
        preserved_fields := preserved_fields || jsonb_build_object('equipment_scheduled_time', existing_rider.data->>'equipment_scheduled_time');
        final_data := final_data || jsonb_build_object('equipment_scheduled_time', existing_rider.data->>'equipment_scheduled_time');
      END IF;
      
      IF existing_rider.data ? 'equipment_location' THEN
        preserved_fields := preserved_fields || jsonb_build_object('equipment_location', existing_rider.data->>'equipment_location');
        final_data := final_data || jsonb_build_object('equipment_location', existing_rider.data->>'equipment_location');
      END IF;
      
      IF existing_rider.data ? 'equipment_partner_id' THEN
        preserved_fields := preserved_fields || jsonb_build_object('equipment_partner_id', existing_rider.data->>'equipment_partner_id');
        final_data := final_data || jsonb_build_object('equipment_partner_id', existing_rider.data->>'equipment_partner_id');
      END IF;
      
      IF existing_rider.data ? 'equipment_allocated_items' THEN
        preserved_fields := preserved_fields || jsonb_build_object('equipment_allocated_items', existing_rider.data->'equipment_allocated_items');
        final_data := final_data || jsonb_build_object('equipment_allocated_items', existing_rider.data->'equipment_allocated_items');
      END IF;
      
      IF existing_rider.data ? 'equipment_total_items' THEN
        preserved_fields := preserved_fields || jsonb_build_object('equipment_total_items', existing_rider.data->>'equipment_total_items');
        final_data := final_data || jsonb_build_object('equipment_total_items', existing_rider.data->>'equipment_total_items');
      END IF;
      
      -- Preserve equipment completion data
      IF existing_rider.data ? 'equipment_completion_date' THEN
        preserved_fields := preserved_fields || jsonb_build_object('equipment_completion_date', existing_rider.data->>'equipment_completion_date');
        final_data := final_data || jsonb_build_object('equipment_completion_date', existing_rider.data->>'equipment_completion_date');
      END IF;
      
      IF existing_rider.data ? 'equipment_completion_time' THEN
        preserved_fields := preserved_fields || jsonb_build_object('equipment_completion_time', existing_rider.data->>'equipment_completion_time');
        final_data := final_data || jsonb_build_object('equipment_completion_time', existing_rider.data->>'equipment_completion_time');
      END IF;
      
      IF existing_rider.data ? 'equipment_distributed_by' THEN
        preserved_fields := preserved_fields || jsonb_build_object('equipment_distributed_by', existing_rider.data->>'equipment_distributed_by');
        final_data := final_data || jsonb_build_object('equipment_distributed_by', existing_rider.data->>'equipment_distributed_by');
      END IF;
    END IF;
    
    -- Update the rider with preserved status data
    UPDATE riders 
    SET 
      data = final_data,
      updated_at = NOW(),
      last_upload_id = p_upload_id
    WHERE rider_id = p_rider_id;
    
    -- Log the update with preserved fields info
    INSERT INTO rider_updates (upload_id, rider_id, action, changed_columns, old_data, new_data, created_at)
    VALUES (
      p_upload_id, 
      p_rider_id, 
      'updated', 
      ARRAY(SELECT jsonb_object_keys(p_new_data)), 
      existing_rider.data,
      final_data || jsonb_build_object('preserved_fields', preserved_fields),
      NOW()
    );
    
    RETURN 'updated';
  END IF;
END;
$$ LANGUAGE plpgsql;