-- Seed data for local development
-- This file is automatically run when starting local Supabase with `supabase start`

-- Note: The foreign key constraint on users.id -> auth.users(id) is dropped in migration
-- 20250806094303, so we can insert seed users directly without creating auth.users entries

-- Insert seed users
INSERT INTO public.users (id, name, photo_url, role, referral_code, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Aditi Rao', '/avatars/aditi.png', 'user', 'ADITI123', '2025-08-01T12:00:00Z'),
('550e8400-e29b-41d4-a716-446655440002', 'Ravi Iyer', '/avatars/ravi.png', 'admin', 'RAVI456', '2025-08-01T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Insert seed communities
INSERT INTO public.communities (id, name, description, city, image_url, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Bangalore Bikers', 'For riders who love weekend escapes.', 'Bangalore', '/images/bikers.png', '2025-08-02T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Insert community members
INSERT INTO public.community_members (user_id, community_id, joined_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', '2025-08-03T10:00:00Z')
ON CONFLICT (user_id, community_id) DO NOTHING;

-- Insert tags
INSERT INTO public.tags (id, name) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'Outdoors'),
('550e8400-e29b-41d4-a716-446655440021', 'Tech')
ON CONFLICT (id) DO NOTHING;

-- Insert events
INSERT INTO public.events (id, community_id, title, description, date_time, venue, capacity, host_id, is_cancelled, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440010', 'Sunday Nandi Ride', 'Early morning ride and breakfast at Nandi Hills', '2025-08-10T06:00:00Z', 'Nandi Hills', 30, '550e8400-e29b-41d4-a716-446655440002', false, '2025-08-03T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Insert event tags
INSERT INTO public.event_tags (event_id, tag_id) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020')
ON CONFLICT (event_id, tag_id) DO NOTHING;

-- Insert event registrations
INSERT INTO public.event_registrations (id, user_id, event_id, status, payment_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440030', 'registered', 'cf-pay-abc123', '2025-08-04T15:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Insert discussions
INSERT INTO public.discussions (id, community_id, title, prompt, created_by, expires_at, is_visible, extended) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440010', 'Pre-ride Checklist', 'What do you pack for a 2-hour ride?', '550e8400-e29b-41d4-a716-446655440002', '2025-08-10T00:00:00Z', true, false)
ON CONFLICT (id) DO NOTHING;

-- Insert discussion comments
INSERT INTO public.discussion_comments (id, discussion_id, user_id, text, created_at, flagged_count) VALUES
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440001', 'I always carry water, basic tools, and a power bank.', '2025-08-04T18:00:00Z', 0)
ON CONFLICT (id) DO NOTHING;

