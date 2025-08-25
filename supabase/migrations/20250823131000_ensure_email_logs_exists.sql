-- Ensure email_logs table and welcome_email_sent_at column exist on remote
-- Idempotent migration to repair missing objects without affecting existing data

-- 1) Add welcome_email_sent_at column if missing
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

-- 2) Create email_logs table if missing
CREATE TABLE IF NOT EXISTS public.email_logs (
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

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_users_welcome_email_sent_at ON public.users(welcome_email_sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- 4) Enable RLS and policies
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_logs' AND policyname='Service can insert email logs'
  ) THEN
    EXECUTE $$CREATE POLICY "Service can insert email logs" ON public.email_logs FOR INSERT WITH CHECK (true)$$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_logs' AND policyname='Service can update email logs'
  ) THEN
    EXECUTE $$CREATE POLICY "Service can update email logs" ON public.email_logs FOR UPDATE USING (true)$$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_logs' AND policyname='Admins can view email logs'
  ) THEN
    EXECUTE $$CREATE POLICY "Admins can view email logs" ON public.email_logs FOR SELECT USING (public.get_user_role() = 'admin')$$;
  END IF;
END$$;

-- 5) Trigger for updated_at
DO $$
DECLARE
  _relid oid;
BEGIN
  SELECT 'public.email_logs'::regclass::oid INTO _relid;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgrelid=_relid AND tgname='update_email_logs_updated_at'
  ) THEN
    EXECUTE $$
      CREATE TRIGGER update_email_logs_updated_at
      BEFORE UPDATE ON public.email_logs
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()
    $$;
  END IF;
END$$;

-- 6) Comments
COMMENT ON TABLE public.email_logs IS 'Tracks email delivery status and metadata for all outbound emails';
COMMENT ON COLUMN public.users.welcome_email_sent_at IS 'Timestamp when welcome email was sent to prevent duplicates';
