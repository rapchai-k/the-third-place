-- Grant service_role access to events table
-- This is needed for edge functions to query events using the service role key

GRANT SELECT ON public.events TO service_role;

-- Also grant on other tables that edge functions may need to access
GRANT SELECT, INSERT, UPDATE ON public.payment_sessions TO service_role;
GRANT SELECT, INSERT ON public.event_registrations TO service_role;
GRANT SELECT ON public.users TO service_role;
GRANT SELECT ON public.app_settings TO service_role;
GRANT SELECT, INSERT ON public.user_activity_log TO service_role;

-- Grant DELETE on payment_sessions to authenticated users (for cancelling unpaid sessions)
GRANT DELETE ON public.payment_sessions TO authenticated;

-- Grant UPDATE on payment_sessions to authenticated users (for cancelling paid sessions)
GRANT UPDATE ON public.payment_sessions TO authenticated;

-- Add DELETE policy for users to delete their own unpaid payment sessions
DROP POLICY IF EXISTS "Users can delete their own unpaid payment sessions" ON public.payment_sessions;
CREATE POLICY "Users can delete their own unpaid payment sessions"
ON public.payment_sessions
FOR DELETE
USING (user_id = auth.uid() AND payment_status = 'yet_to_pay');

-- Add UPDATE policy for users to cancel their own paid payment sessions
-- Users can only change status/payment_status to 'cancelled'
DROP POLICY IF EXISTS "Users can cancel their own paid payment sessions" ON public.payment_sessions;
CREATE POLICY "Users can cancel their own paid payment sessions"
ON public.payment_sessions
FOR UPDATE
USING (user_id = auth.uid() AND payment_status = 'paid')
WITH CHECK (user_id = auth.uid() AND status = 'cancelled' AND payment_status = 'cancelled');

