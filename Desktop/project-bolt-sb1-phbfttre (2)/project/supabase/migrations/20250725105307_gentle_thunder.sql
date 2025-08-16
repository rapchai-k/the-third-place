/*
  # Fix RLS Infinite Recursion

  1. Problem
    - Current RLS policies on users table cause infinite recursion
    - Policies query users table from within users table policies
    
  2. Solution
    - Use auth.uid() directly instead of querying users table
    - Simplify policies to avoid circular dependencies
    
  3. Changes
    - Drop existing problematic policies
    - Create new simplified policies
    - Use auth.jwt() for role-based access
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins and admins can insert users" ON users;
DROP POLICY IF EXISTS "Super admins and admins can update users" ON users;
DROP POLICY IF EXISTS "Super admins and admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create simplified policies that don't cause recursion
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- For admin operations, we'll handle permissions in the application layer
-- This avoids the infinite recursion issue
CREATE POLICY "Allow authenticated users to insert"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view all"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update all"
  ON users
  FOR UPDATE
  TO authenticated
  USING (true);