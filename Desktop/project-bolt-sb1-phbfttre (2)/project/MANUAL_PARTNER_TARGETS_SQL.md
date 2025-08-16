# 🎯 MANUAL PARTNER TARGETS - SQL COMMANDS

## PROBLEM
- Partner target columns (car_target, bike_target, total_target) not added to database
- Hardcoded values (50/50) instead of dynamic database values

## 🔧 MANUAL SQL COMMANDS

### Step 1: Add Target Columns to Partners Table
Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Add target columns to partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS car_target integer DEFAULT 50;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS bike_target integer DEFAULT 50;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS total_target integer DEFAULT 100;

-- Add comments for clarity
COMMENT ON COLUMN partners.car_target IS 'Maximum number of car delivery riders for this partner';
COMMENT ON COLUMN partners.bike_target IS 'Maximum number of motorcycle delivery riders for this partner';
COMMENT ON COLUMN partners.total_target IS 'Maximum total number of riders for this partner';

-- Update existing partners with default values
UPDATE partners SET 
  car_target = 50,
  bike_target = 50,
  total_target = 100
WHERE car_target IS NULL OR bike_target IS NULL OR total_target IS NULL;
```

### Step 2: Create Partner Capacity Check Function
```sql
-- Create function to check partner capacity
CREATE OR REPLACE FUNCTION check_partner_capacity(
  p_partner_id text,
  p_delivery_type text,
  p_additional_count integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  partner_record partners%ROWTYPE;
  current_car_count integer := 0;
  current_bike_count integer := 0;
  current_total_count integer := 0;
  can_schedule boolean := true;
  error_message text := '';
BEGIN
  -- Get partner information
  SELECT * INTO partner_record
  FROM partners
  WHERE partner_id = p_partner_id OR id::text = p_partner_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'can_schedule', false,
      'error', 'Partner not found',
      'partner_name', 'Unknown Partner'
    );
  END IF;
  
  -- Count current scheduled + completed riders for this partner
  SELECT 
    COUNT(*) FILTER (WHERE data->>'delivery_type' = 'Car' AND data->>'training_status' IN ('Scheduled', 'Completed')),
    COUNT(*) FILTER (WHERE data->>'delivery_type' = 'Motorcycle' AND data->>'training_status' IN ('Scheduled', 'Completed')),
    COUNT(*) FILTER (WHERE data->>'training_status' IN ('Scheduled', 'Completed'))
  INTO current_car_count, current_bike_count, current_total_count
  FROM riders
  WHERE data->>'partner_id' = p_partner_id;
  
  -- Check capacity based on delivery type
  IF p_delivery_type = 'Car' THEN
    IF (current_car_count + p_additional_count) > partner_record.car_target THEN
      can_schedule := false;
      error_message := format('Car capacity exceeded: %s/%s (trying to add %s)', 
        current_car_count, partner_record.car_target, p_additional_count);
    END IF;
  ELSIF p_delivery_type = 'Motorcycle' THEN
    IF (current_bike_count + p_additional_count) > partner_record.bike_target THEN
      can_schedule := false;
      error_message := format('Motorcycle capacity exceeded: %s/%s (trying to add %s)', 
        current_bike_count, partner_record.bike_target, p_additional_count);
    END IF;
  END IF;
  
  -- Check total capacity
  IF (current_total_count + p_additional_count) > partner_record.total_target THEN
    can_schedule := false;
    error_message := format('Total capacity exceeded: %s/%s (trying to add %s)', 
      current_total_count, partner_record.total_target, p_additional_count);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'can_schedule', can_schedule,
    'error', error_message,
    'partner_name', partner_record.partner_name,
    'current_car_count', current_car_count,
    'current_bike_count', current_bike_count,
    'current_total_count', current_total_count,
    'car_target', partner_record.car_target,
    'bike_target', partner_record.bike_target,
    'total_target', partner_record.total_target
  );
END;
$$;
```

### Step 3: Verify Columns Added
After running the SQL, verify in Table Editor that partners table has:
- ✅ car_target (integer, default 50)
- ✅ bike_target (integer, default 50)  
- ✅ total_target (integer, default 100)

## ✅ VERIFICATION
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL commands above
3. Check Table Editor → partners table
4. Verify new columns exist with default values
5. Test the capacity check function

The database will now have proper target columns and validation!