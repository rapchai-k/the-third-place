/*
  # Create Super Admin User

  1. New User
    - Creates a super admin user with email and password
    - Email: admin@riderflow.com
    - Password: RiderFlow2024!
    - Role: super_admin
    - Status: active

  2. Authentication
    - Uses Supabase auth.users table for authentication
    - Links to users table for profile information

  Note: This creates a user account that can be used to log into the system.
  The password should be changed after first login in a production environment.
*/

-- Insert user into auth.users table (Supabase authentication)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@riderflow.com',
  crypt('RiderFlow2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Super", "last_name": "Admin"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Insert user profile into users table
INSERT INTO users (
  id,
  email,
  role,
  first_name,
  last_name,
  is_active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@riderflow.com',
  'super_admin',
  'Super',
  'Admin',
  true,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;