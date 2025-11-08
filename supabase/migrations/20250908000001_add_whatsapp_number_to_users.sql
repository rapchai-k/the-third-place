-- Add whatsapp_number column to users table
ALTER TABLE public.users 
ADD COLUMN whatsapp_number TEXT;

-- Create RLS policy for whatsapp_number
CREATE POLICY "Users can view own whatsapp_number" 
ON public.users 
FOR SELECT 
USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "Users can update own whatsapp_number" 
ON public.users 
FOR UPDATE 
USING (id = auth.uid() OR get_user_role() = 'admin')
WITH CHECK (id = auth.uid() OR get_user_role() = 'admin');

