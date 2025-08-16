/*
  # Add Partner Target Limits

  1. New Columns
    - `car_target` (integer) - Maximum car delivery riders this partner can handle
    - `bike_target` (integer) - Maximum motorcycle delivery riders this partner can handle  
    - `total_target` (integer) - Maximum total riders this partner can handle

  2. Business Logic
    - Partners cannot exceed their target limits
    - Scheduled + Completed counts towards the target
    - Prevents over-scheduling beyond partner capacity

  3. Validation
    - All target fields default to reasonable values
    - Targets must be positive numbers
*/

-- Add target columns to partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS car_target integer DEFAULT 50;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS bike_target integer DEFAULT 50;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS total_target integer DEFAULT 100;

-- Add constraints to ensure targets are positive
ALTER TABLE partners ADD CONSTRAINT IF NOT EXISTS partners_car_target_positive CHECK (car_target > 0);
ALTER TABLE partners ADD CONSTRAINT IF NOT EXISTS partners_bike_target_positive CHECK (bike_target > 0);
ALTER TABLE partners ADD CONSTRAINT IF NOT EXISTS partners_total_target_positive CHECK (total_target > 0);

-- Update existing partners with default target values
UPDATE partners SET 
  car_target = 50,
  bike_target = 50,
  total_target = 100
WHERE car_target IS NULL OR bike_target IS NULL OR total_target IS NULL;

-- Create function to check partner capacity before scheduling
CREATE OR REPLACE FUNCTION check_partner_capacity(
  p_partner_id text,
  p_delivery_type text,
  p_additional_count integer DEFAULT 1
) RETURNS jsonb AS $$
DECLARE
  partner_record partners%ROWTYPE;
  current_car_count integer := 0;
  current_bike_count integer := 0;
  current_total_count integer := 0;
  result jsonb;
BEGIN
  -- Get partner information
  SELECT * INTO partner_record FROM partners WHERE partner_id = p_partner_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Partner not found'
    );
  END IF;
  
  -- Count current scheduled and completed riders for this partner
  SELECT 
    COUNT(*) FILTER (WHERE data->>'delivery_type' = 'Car' AND 
                           (data->>'training_status' IN ('Scheduled', 'Completed') OR 
                            data->>'box_installation' IN ('Scheduled', 'Completed') OR 
                            data->>'equipment_status' IN ('Scheduled', 'Completed'))),
    COUNT(*) FILTER (WHERE data->>'delivery_type' = 'Motorcycle' AND 
                           (data->>'training_status' IN ('Scheduled', 'Completed') OR 
                            data->>'box_installation' IN ('Scheduled', 'Completed') OR 
                            data->>'equipment_status' IN ('Scheduled', 'Completed'))),
    COUNT(*) FILTER (WHERE data->>'training_status' IN ('Scheduled', 'Completed') OR 
                           data->>'box_installation' IN ('Scheduled', 'Completed') OR 
                           data->>'equipment_status' IN ('Scheduled', 'Completed'))
  INTO current_car_count, current_bike_count, current_total_count
  FROM riders 
  WHERE data->>'partner_id' = p_partner_id;
  
  -- Check capacity limits
  result := jsonb_build_object(
    'success', true,
    'partner_name', partner_record.partner_name,
    'current_car_count', current_car_count,
    'current_bike_count', current_bike_count,
    'current_total_count', current_total_count,
    'car_target', partner_record.car_target,
    'bike_target', partner_record.bike_target,
    'total_target', partner_record.total_target,
    'car_available', partner_record.car_target - current_car_count,
    'bike_available', partner_record.bike_target - current_bike_count,
    'total_available', partner_record.total_target - current_total_count
  );
  
  -- Check if adding new riders would exceed limits
  IF p_delivery_type = 'Car' THEN
    IF current_car_count + p_additional_count > partner_record.car_target THEN
      result := result || jsonb_build_object(
        'can_schedule', false,
        'error', format('Car target exceeded: %s/%s (trying to add %s)', 
                       current_car_count, partner_record.car_target, p_additional_count)
      );
    ELSE
      result := result || jsonb_build_object('can_schedule', true);
    END IF;
  ELSIF p_delivery_type = 'Motorcycle' THEN
    IF current_bike_count + p_additional_count > partner_record.bike_target THEN
      result := result || jsonb_build_object(
        'can_schedule', false,
        'error', format('Bike target exceeded: %s/%s (trying to add %s)', 
                       current_bike_count, partner_record.bike_target, p_additional_count)
      );
    ELSE
      result := result || jsonb_build_object('can_schedule', true);
    END IF;
  END IF;
  
  -- Check total target
  IF current_total_count + p_additional_count > partner_record.total_target THEN
    result := result || jsonb_build_object(
      'can_schedule', false,
      'error', format('Total target exceeded: %s/%s (trying to add %s)', 
                     current_total_count, partner_record.total_target, p_additional_count)
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;