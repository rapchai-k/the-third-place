/*
  # Insert Sample Data for RiderFlow

  This migration adds sample data for testing and demonstration purposes.
*/

-- Insert sample equipment items
INSERT INTO equipment_items (name, category, sizes, current_price, is_chargeable, is_active) VALUES
('Safety Helmet', 'safety', ARRAY['S', 'M', 'L', 'XL'], 25.00, true, true),
('Reflective Jacket', 'safety', ARRAY['S', 'M', 'L', 'XL', 'XXL'], 15.00, true, true),
('Delivery Bag', 'equipment', ARRAY['Standard'], 30.00, true, true),
('Phone Holder', 'equipment', ARRAY['Universal'], 10.00, false, true),
('Rain Cover', 'weather', ARRAY['One Size'], 8.00, true, true),
('Knee Pads', 'safety', ARRAY['S', 'M', 'L'], 12.00, true, true),
('Gloves', 'safety', ARRAY['S', 'M', 'L', 'XL'], 7.00, true, true),
('First Aid Kit', 'safety', ARRAY['Standard'], 20.00, false, true);

-- Insert sample riders
INSERT INTO riders (rider_id, first_name, last_name, phone, email, status, three_pl_status, vehicle_type) VALUES
('RD001', 'John', 'Smith', '+1234567890', 'john.smith@email.com', 'audit_pass', 'active', 'bike'),
('RD002', 'Sarah', 'Johnson', '+1234567891', 'sarah.johnson@email.com', 'on_job', 'active', 'bike'),
('RD003', 'Mike', 'Brown', '+1234567892', 'mike.brown@email.com', 'audit_pass', 'active', 'scooter'),
('RD004', 'Lisa', 'Davis', '+1234567893', 'lisa.davis@email.com', 'audit_pass', 'active', 'bike'),
('RD005', 'Tom', 'Wilson', '+1234567894', 'tom.wilson@email.com', 'on_job', 'active', 'bike'),
('RD006', 'Emma', 'Garcia', '+1234567895', 'emma.garcia@email.com', 'audit_pass', 'active', 'scooter'),
('RD007', 'James', 'Martinez', '+1234567896', 'james.martinez@email.com', 'audit_pass', 'active', 'bike'),
('RD008', 'Anna', 'Rodriguez', '+1234567897', 'anna.rodriguez@email.com', 'on_job', 'active', 'bike'),
('RD009', 'David', 'Lee', '+1234567898', 'david.lee@email.com', 'audit_pass', 'active', 'scooter'),
('RD010', 'Maria', 'Lopez', '+1234567899', 'maria.lopez@email.com', 'audit_pass', 'active', 'bike');