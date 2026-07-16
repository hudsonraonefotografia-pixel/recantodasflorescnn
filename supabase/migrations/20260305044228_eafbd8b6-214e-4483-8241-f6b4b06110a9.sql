
-- Add address and user_type fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS endereco text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ponto_referencia text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'cliente';

-- Partner profiles table for extended partner data
CREATE TABLE public.partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nome_completo text NOT NULL,
  cpf_cnpj text NOT NULL,
  endereco text NOT NULL,
  ponto_referencia text,
  nome_estabelecimento text NOT NULL,
  seguimento text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own partner profile" ON public.partner_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own partner profile" ON public.partner_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own partner profile" ON public.partner_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Add partner price column to produtos
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS preco_parceiro numeric;

-- Trigger for updated_at on partner_profiles
CREATE TRIGGER update_partner_profiles_updated_at
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
