/*
  # RiderFlow Database Schema

  1. New Tables
    - `users` - System users with role-based access
    - `riders` - Rider information and status
    - `equipment_items` - Equipment master data with pricing
    - `equipment_pricing_history` - Historical pricing data
    - `trainings` - Training sessions and completion tracking
    - `box_installations` - Box installation scheduling and tracking
    - `equipment_distributions` - Equipment distribution records
    - `audit_logs` - System audit trail
    - `notifications` - System notifications
    
  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    
  3. Functions
    - Audit logging trigger function
    - User role validation functions
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and role management
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'training_person', 'equipment_person')),
    first_name text NOT NULL,
    last_name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Riders table
CREATE TABLE IF NOT EXISTS riders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id text UNIQUE NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text NOT NULL,
    email text,
    status text NOT NULL DEFAULT 'audit_pass' CHECK (status IN ('audit_pass', 'on_job', 'inactive')),
    three_pl_status text NOT NULL DEFAULT 'active' CHECK (three_pl_status IN ('active', 'inactive')),
    vehicle_type text NOT NULL DEFAULT 'bike' CHECK (vehicle_type IN ('bike', 'scooter')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Equipment items master table
CREATE TABLE IF NOT EXISTS equipment_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    category text NOT NULL DEFAULT 'general',
    sizes text[] DEFAULT ARRAY['One Size'],
    current_price decimal(10,2) DEFAULT 0,
    is_chargeable boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Equipment pricing history
CREATE TABLE IF NOT EXISTS equipment_pricing_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_item_id uuid REFERENCES equipment_items(id) ON DELETE CASCADE,
    price decimal(10,2) NOT NULL,
    effective_date timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now()
);

-- Training sessions
CREATE TABLE IF NOT EXISTS trainings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id uuid REFERENCES riders(id) ON DELETE CASCADE,
    scheduled_date date NOT NULL,
    scheduled_time time NOT NULL,
    location text NOT NULL,
    trainer_name text NOT NULL,
    language text NOT NULL DEFAULT 'English',
    status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    completion_date timestamptz,
    notes text,
    created_by uuid REFERENCES users(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Box installations
CREATE TABLE IF NOT EXISTS box_installations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id uuid REFERENCES riders(id) ON DELETE CASCADE,
    scheduled_date date NOT NULL,
    scheduled_time time NOT NULL,
    location text NOT NULL,
    status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    completion_date timestamptz,
    proof_image_url text,
    notes text,
    created_by uuid REFERENCES users(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Equipment distributions
CREATE TABLE IF NOT EXISTS equipment_distributions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id uuid REFERENCES riders(id) ON DELETE CASCADE,
    equipment_items jsonb NOT NULL, -- Array of {item_id, item_name, size, quantity, unit_price, is_free}
    total_amount decimal(10,2) DEFAULT 0,
    distribution_date timestamptz DEFAULT now(),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'distributed', 'returned')),
    notes text,
    created_by uuid REFERENCES users(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id),
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    old_values jsonb,
    new_values jsonb,
    created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_riders_rider_id ON riders(rider_id);
CREATE INDEX IF NOT EXISTS idx_riders_phone ON riders(phone);
CREATE INDEX IF NOT EXISTS idx_trainings_rider_id ON trainings(rider_id);
CREATE INDEX IF NOT EXISTS idx_trainings_scheduled_date ON trainings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_installations_rider_id ON box_installations(rider_id);
CREATE INDEX IF NOT EXISTS idx_installations_scheduled_date ON box_installations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_distributions_rider_id ON equipment_distributions(rider_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admins and admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Super admins and admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Super admins and admins can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- Riders policies
CREATE POLICY "Authenticated users can view riders" ON riders
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins and admins can modify riders" ON riders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- Equipment items policies
CREATE POLICY "Authenticated users can view equipment items" ON equipment_items
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins and admins can modify equipment items" ON equipment_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- Training policies
CREATE POLICY "Authenticated users can view trainings" ON trainings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Training persons can view assigned trainings" ON trainings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'training_person'
        )
    );

CREATE POLICY "Authorized users can modify trainings" ON trainings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'training_person')
        )
    );

-- Box installation policies
CREATE POLICY "Authenticated users can view installations" ON box_installations
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can modify installations" ON box_installations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- Equipment distribution policies
CREATE POLICY "Authenticated users can view distributions" ON equipment_distributions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can modify distributions" ON equipment_distributions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'equipment_person')
        )
    );

-- Audit log policies
CREATE POLICY "Super admins and admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON riders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_items_updated_at BEFORE UPDATE ON equipment_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON trainings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installations_updated_at BEFORE UPDATE ON box_installations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributions_updated_at BEFORE UPDATE ON equipment_distributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();