-- Add price field to events table
ALTER TABLE public.events 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN currency TEXT DEFAULT 'INR';

-- Create payment_sessions table
CREATE TABLE public.payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  cashfree_order_id TEXT UNIQUE,
  cashfree_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour')
);

-- Create payment_logs table for audit trail
CREATE TABLE public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_session_id UUID NOT NULL REFERENCES public.payment_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  cashfree_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add payment_session_id to event_registrations
ALTER TABLE public.event_registrations 
ADD COLUMN payment_session_id UUID REFERENCES public.payment_sessions(id);

-- Enable RLS for payment tables
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_sessions
CREATE POLICY "Users can view their own payment sessions" 
ON public.payment_sessions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own payment sessions" 
ON public.payment_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service can update payment sessions" 
ON public.payment_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can view all payment sessions" 
ON public.payment_sessions 
FOR SELECT 
USING (get_user_role() = 'admin'::user_role);

-- RLS policies for payment_logs  
CREATE POLICY "Service can insert payment logs" 
ON public.payment_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view payment logs" 
ON public.payment_logs 
FOR SELECT 
USING (get_user_role() = 'admin'::user_role);

-- Create indexes for performance
CREATE INDEX idx_payment_sessions_user_id ON public.payment_sessions(user_id);
CREATE INDEX idx_payment_sessions_event_id ON public.payment_sessions(event_id);
CREATE INDEX idx_payment_sessions_cashfree_order_id ON public.payment_sessions(cashfree_order_id);
CREATE INDEX idx_payment_logs_payment_session_id ON public.payment_logs(payment_session_id);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_sessions_updated_at
BEFORE UPDATE ON public.payment_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();