-- Create topic_requests table for users to suggest discussion topics
-- Designed to support admin review workflow:
--   pending → approved (then 1-click create discussion) or rejected
--
-- NOTE FOR ADMIN PANEL AGENT:
--   This table (topic_requests) powers the "Topic Requests" review queue.
--   Each row contains everything needed to create a discussion in one click:
--     • topic        → maps to discussions.title
--     • description  → maps to discussions.prompt  (the actual discussion question)
--     • community_id → maps to discussions.community_id
--     • user_id      → the requester (for attribution / notifications)
--     • reason       → admin-only context for why the user wants this topic
--   When an admin approves a request:
--     1. Create a new row in `discussions` using the fields above
--        (admin only needs to set expires_at and created_by)
--     2. Update this row: status='approved', reviewed_by=admin_uid, reviewed_at=now(),
--        and set discussion_id to link back to the created discussion.
--   When rejected: status='rejected', reviewed_by, reviewed_at, admin_notes.
--   The admin_notes column lets the admin leave a reason for rejection or any context.

CREATE TABLE public.topic_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  description TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  discussion_id UUID REFERENCES public.discussions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_topic_requests_status ON public.topic_requests(status);
CREATE INDEX idx_topic_requests_community ON public.topic_requests(community_id);
CREATE INDEX idx_topic_requests_user ON public.topic_requests(user_id);
CREATE INDEX idx_topic_requests_created ON public.topic_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.topic_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert their own requests
DROP POLICY IF EXISTS "Users can create their own topic requests" ON public.topic_requests;
CREATE POLICY "Users can create their own topic requests"
ON public.topic_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own requests, admins can view all
DROP POLICY IF EXISTS "Users can view own requests and admins view all" ON public.topic_requests;
CREATE POLICY "Users can view own requests and admins view all"
ON public.topic_requests
FOR SELECT
USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Policy: Only admins can update requests (for review actions)
DROP POLICY IF EXISTS "Admins can update topic requests" ON public.topic_requests;
CREATE POLICY "Admins can update topic requests"
ON public.topic_requests
FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

