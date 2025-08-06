-- Insert seed data from docs/01-seed-data.json

-- Insert users
INSERT INTO public.users (id, name, photo_url, role, referral_code, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Aditi Rao', '/avatars/aditi.png', 'user', 'ADITI123', '2025-08-01T12:00:00Z'),
('00000000-0000-0000-0000-000000000002', 'Ravi Iyer', '/avatars/ravi.png', 'admin', 'RAVI456', '2025-08-01T12:00:00Z');

-- Insert communities
INSERT INTO public.communities (id, name, description, city, image_url, created_at) VALUES
('00000000-0000-0000-0000-000000000010', 'Bangalore Bikers', 'For riders who love weekend escapes.', 'Bangalore', '/images/bikers.png', '2025-08-02T08:00:00Z');

-- Insert community members
INSERT INTO public.community_members (user_id, community_id, joined_at) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '2025-08-03T10:00:00Z');

-- Insert tags
INSERT INTO public.tags (id, name) VALUES
('00000000-0000-0000-0000-000000000020', 'Outdoors'),
('00000000-0000-0000-0000-000000000021', 'Tech');

-- Insert events
INSERT INTO public.events (id, community_id, title, description, date_time, venue, capacity, host_id, is_cancelled, created_at) VALUES
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', 'Sunday Nandi Ride', 'Early morning ride and breakfast at Nandi Hills', '2025-08-10T06:00:00Z', 'Nandi Hills', 30, '00000000-0000-0000-0000-000000000002', false, '2025-08-03T09:00:00Z');

-- Insert event tags
INSERT INTO public.event_tags (event_id, tag_id) VALUES
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000020');

-- Insert event registrations
INSERT INTO public.event_registrations (id, user_id, event_id, status, payment_id, created_at) VALUES
('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000030', 'success', 'cf-pay-abc123', '2025-08-04T15:00:00Z');

-- Insert discussions
INSERT INTO public.discussions (id, community_id, title, prompt, created_by, expires_at, is_visible, extended) VALUES
('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000010', 'Pre-ride Checklist', 'What do you pack for a 2-hour ride?', '00000000-0000-0000-0000-000000000002', '2025-08-10T00:00:00Z', true, false);

-- Insert discussion comments
INSERT INTO public.discussion_comments (id, discussion_id, user_id, text, created_at, flagged_count) VALUES
('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', 'I always carry water, basic tools, and a power bank.', '2025-08-04T18:00:00Z', 0);