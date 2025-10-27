-- Add welcome_email_sent_at field to users table
ALTER TABLE public.users 
ADD COLUMN welcome_email_sent_at TIMESTAMPTZ;

-- Create email_logs table for tracking email deliveries
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'resend',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_users_welcome_email_sent_at ON public.users(welcome_email_sent_at);
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at);

-- Enable RLS on email_logs table
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_logs table
CREATE POLICY "Service can insert email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service can update email logs" 
ON public.email_logs 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can view email logs" 
ON public.email_logs 
FOR SELECT 
USING (public.get_user_role() = 'admin');

-- Add updated_at trigger for email_logs
CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.email_logs IS 'Tracks email delivery status and metadata for all outbound emails';
COMMENT ON COLUMN public.users.welcome_email_sent_at IS 'Timestamp when welcome email was sent to prevent duplicates';
