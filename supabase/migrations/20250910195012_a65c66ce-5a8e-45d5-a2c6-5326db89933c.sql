-- Create table for user requests (discussions, events, communities)
CREATE TABLE public.user_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('discussion', 'event', 'community')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  additional_details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own requests" 
ON public.user_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests" 
ON public.user_requests 
FOR SELECT 
USING (auth.uid() = user_id OR get_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can manage all requests" 
ON public.user_requests 
FOR ALL 
USING (get_user_role() = 'admin'::user_role);

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_requests_updated_at
BEFORE UPDATE ON public.user_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();