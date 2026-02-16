ALTER TABLE public.payment_sessions
ADD COLUMN cancelled_by_user_at TIMESTAMPTZ;

CREATE INDEX idx_payment_sessions_cancelled_by_user
ON public.payment_sessions(cancelled_by_user_at)
WHERE cancelled_by_user_at IS NOT NULL;
