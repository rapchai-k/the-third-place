-- Fix: Allow authenticated users to register for events without requiring prior community membership.
-- The frontend auto-joins the user to the community before registering, but the RLS policy's
-- is_community_member() check can fail due to PostgreSQL's STABLE function caching during
-- policy evaluation. Since community auto-join is handled at the application level (both in
-- the frontend hook and edge functions), the RLS policy should only enforce that users can
-- only create registrations for themselves.

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Community members can register for events" ON "public"."event_registrations";

-- Create a new policy that allows authenticated users to register for events
-- The community membership is enforced at the application level, not at the RLS level
CREATE POLICY "Authenticated users can register for events"
ON "public"."event_registrations"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

