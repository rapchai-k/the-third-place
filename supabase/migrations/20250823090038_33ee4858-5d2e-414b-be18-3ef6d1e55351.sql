-- Fix security vulnerability: Restrict community_members SELECT access
-- Currently anyone can view all community members, exposing user IDs and privacy

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view community members" ON public.community_members;

-- Create a more secure policy that only allows:
-- 1. Users to see members of communities they belong to
-- 2. Admins to see all community members
CREATE POLICY "Users can view members of joined communities only" 
ON public.community_members 
FOR SELECT 
USING (
  -- User can see members of communities they belong to
  EXISTS (
    SELECT 1 
    FROM public.community_members cm 
    WHERE cm.community_id = community_members.community_id 
    AND cm.user_id = auth.uid()
  )
  OR 
  -- Or user is an admin
  (get_user_role() = 'admin'::user_role)
);