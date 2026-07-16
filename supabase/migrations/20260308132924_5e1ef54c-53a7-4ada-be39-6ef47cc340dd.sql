
-- Create partner_requests table
CREATE TABLE public.partner_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome_completo TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  cidade TEXT NOT NULL,
  quantidade_media TEXT NOT NULL,
  finalidade TEXT NOT NULL DEFAULT 'consumo',
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "Users can insert own partner requests"
  ON public.partner_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own partner requests"
  ON public.partner_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all partner requests"
  ON public.partner_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update partner requests"
  ON public.partner_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update profiles (to change user_type)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add unit_type column to produtos for weight/units
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS unit_type TEXT NOT NULL DEFAULT 'unidade';
