-- Fix community member count issue caused by RLS policy
-- The RLS policy on community_members restricts viewing to members only,
-- which causes count aggregations to return 0 for non-members.
-- Solution: Add a member_count column to communities table and maintain it with triggers.

-- Add member_count column to communities table
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS member_count INTEGER NOT NULL DEFAULT 0;

-- Create function to update member count
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count when a member joins
    UPDATE public.communities
    SET member_count = member_count + 1
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count when a member leaves
    UPDATE public.communities
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS trigger_update_community_member_count_insert ON public.community_members;
CREATE TRIGGER trigger_update_community_member_count_insert
AFTER INSERT ON public.community_members
FOR EACH ROW
EXECUTE FUNCTION public.update_community_member_count();

-- Create trigger for DELETE operations
DROP TRIGGER IF EXISTS trigger_update_community_member_count_delete ON public.community_members;
CREATE TRIGGER trigger_update_community_member_count_delete
AFTER DELETE ON public.community_members
FOR EACH ROW
EXECUTE FUNCTION public.update_community_member_count();

-- Initialize member_count for existing communities
UPDATE public.communities c
SET member_count = (
  SELECT COUNT(*)::INTEGER
  FROM public.community_members cm
  WHERE cm.community_id = c.id
);

-- Add comment to document the column
COMMENT ON COLUMN public.communities.member_count IS
'Cached count of community members, automatically maintained by triggers. This allows public access to member counts without exposing individual member data.';

