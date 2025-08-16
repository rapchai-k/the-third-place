/*
  # Update Super Admin User

  1. Changes
    - Remove old admin@riderflow.com user if exists
    - Create new super admin with sales@magizcreations.com
    - Set up proper user profile with super_admin role

  2. Security
    - User will need to be created in Supabase Auth dashboard
    - Profile will be automatically linked when they first sign in
*/

-- Remove old admin user if exists
DELETE FROM users WHERE email = 'admin@riderflow.com';

-- Insert new super admin user profile
INSERT INTO users (
  id,
  email,
  role,
  first_name,
  last_name,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'sales@magizcreations.com',
  'super_admin',
  'Sales',
  'Admin',
  true
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  is_active = EXCLUDED.is_active,
  updated_at = now();