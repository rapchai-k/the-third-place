-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Create security definer function for user role checking
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Users table policies
CREATE POLICY "Users can view own profile and admins can view all" ON public.users
  FOR SELECT USING (id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Users can update own profile and admins can update all" ON public.users
  FOR UPDATE USING (id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Service can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Notification preferences policies
CREATE POLICY "Users can view own preferences" ON public.notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences" ON public.notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service can insert preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (true);

-- User badges policies
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage badges" ON public.user_badges
  FOR ALL USING (public.get_user_role() = 'admin');

-- Communities policies (public read, admin write)
CREATE POLICY "Anyone can view communities" ON public.communities
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage communities" ON public.communities
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update communities" ON public.communities
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete communities" ON public.communities
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Community members policies
CREATE POLICY "Users can view community members" ON public.community_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join communities" ON public.community_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave communities or admins can remove" ON public.community_members
  FOR DELETE USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- Tags policies (public read, admin write)
CREATE POLICY "Anyone can view tags" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" ON public.tags
  FOR ALL USING (public.get_user_role() = 'admin');

-- Events policies (public read, admin write)
CREATE POLICY "Anyone can view events" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage events" ON public.events
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update events" ON public.events
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete events" ON public.events
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Event tags policies (public read, admin write)
CREATE POLICY "Anyone can view event tags" ON public.event_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage event tags" ON public.event_tags
  FOR ALL USING (public.get_user_role() = 'admin');

-- Event registrations policies
CREATE POLICY "Users can view own registrations and admins can view all" ON public.event_registrations
  FOR SELECT USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Users can register for events" ON public.event_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service and admins can update registrations" ON public.event_registrations
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can cancel own registrations and admins can cancel any" ON public.event_registrations
  FOR DELETE USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- Discussions policies
CREATE POLICY "Anyone can view visible discussions" ON public.discussions
  FOR SELECT USING (is_visible = true OR public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage discussions" ON public.discussions
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update discussions" ON public.discussions
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete discussions" ON public.discussions
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Discussion comments policies
CREATE POLICY "Anyone can view comments on visible discussions" ON public.discussion_comments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.discussions 
    WHERE id = discussion_id AND (is_visible = true OR public.get_user_role() = 'admin')
  ));

CREATE POLICY "Community members can comment on discussions" ON public.discussion_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.discussions d
      JOIN public.community_members cm ON cm.community_id = d.community_id
      WHERE d.id = discussion_id AND cm.user_id = auth.uid() AND d.expires_at > now()
    )
  );

CREATE POLICY "Users can update own comments (grace period) or admins can update any" ON public.discussion_comments
  FOR UPDATE USING (
    (user_id = auth.uid() AND created_at > now() - interval '15 minutes') OR 
    public.get_user_role() = 'admin'
  );

CREATE POLICY "Users can delete own comments or admins can delete any" ON public.discussion_comments
  FOR DELETE USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- Flags policies
CREATE POLICY "Authenticated users can create flags" ON public.flags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND flagged_by_id = auth.uid());

CREATE POLICY "Admins can view and manage flags" ON public.flags
  FOR ALL USING (public.get_user_role() = 'admin');

-- Referrals policies
CREATE POLICY "Users can view referrals they made or received" ON public.referrals
  FOR SELECT USING (
    referrer_id = auth.uid() OR 
    referred_user_id = auth.uid() OR 
    public.get_user_role() = 'admin'
  );

CREATE POLICY "Service can create referrals" ON public.referrals
  FOR INSERT WITH CHECK (true);

-- User activity log policies
CREATE POLICY "Users can view own activity and admins can view all" ON public.user_activity_log
  FOR SELECT USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Service can log activity" ON public.user_activity_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage activity logs" ON public.user_activity_log
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete activity logs" ON public.user_activity_log
  FOR DELETE USING (public.get_user_role() = 'admin');