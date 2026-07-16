
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  -- Create welcome notification
  INSERT INTO public.notifications (user_id, title, message)
  VALUES (NEW.id, '🌿 Bem-vindo ao Recanto das Flores!', 'Seja bem-vindo! Explore nossos produtos frescos direto da granja para sua mesa. Aproveite nossas ofertas e assinaturas!');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Table to store push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Table to store VAPID keys (singleton)
CREATE TABLE public.vapid_keys (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vapid_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access VAPID keys (no public access)
-- Edge functions use service role key to read these

-- Update handle_new_user to also invoke send-push via pg_net (optional, won't break if not available)
-- For now, the push will be triggered from the application code when new notifications are created

-- Add an index for faster push subscription lookups
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: admins can see all roles, users can see their own
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert notifications for any user
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create produtos table for barcode/QR scanning
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0,
  categoria TEXT,
  validade DATE,
  lote TEXT,
  codigo_barras TEXT UNIQUE,
  qr_code_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable (anyone logged in can see them)
CREATE POLICY "Authenticated users can view products"
ON public.produtos FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage products
CREATE POLICY "Admins can insert products"
ON public.produtos FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products"
ON public.produtos FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products"
ON public.produtos FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create purchase history table
CREATE TABLE public.purchase_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
ON public.purchase_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
ON public.purchase_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create user_subscriptions table to track subscription type
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  subscription_type TEXT NOT NULL, -- 'semanal' or 'quinzenal'
  quantity INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Table to track total cashback earned per user (cumulative, never decreases)
CREATE TABLE public.cashback_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_earned numeric NOT NULL DEFAULT 0,
  display_name text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cashback_points ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see the ranking
CREATE POLICY "Authenticated users can view ranking"
ON public.cashback_points FOR SELECT
TO authenticated
USING (true);

-- Users can upsert their own record
CREATE POLICY "Users can insert their own points"
ON public.cashback_points FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
ON public.cashback_points FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 1. Category multipliers (admin-configurable)
CREATE TABLE public.category_multipliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL UNIQUE,
  points_per_real integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.category_multipliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view multipliers" ON public.category_multipliers
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage multipliers" ON public.category_multipliers
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed default multipliers
INSERT INTO public.category_multipliers (category_name, points_per_real) VALUES
  ('Ovos Caipira', 15),
  ('Produtos da Roça', 12),
  ('Frango Caipira', 10),
  ('Carne Suína', 10),
  ('Polpas Naturais', 10),
  ('Carne Bovina', 8);

-- 2. Monthly points tracking (for monthly ranking reset)
CREATE TABLE public.farm_points_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text,
  points integer NOT NULL DEFAULT 0,
  month integer NOT NULL,
  year integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);
ALTER TABLE public.farm_points_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view monthly ranking" ON public.farm_points_monthly
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own monthly points" ON public.farm_points_monthly
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly points" ON public.farm_points_monthly
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 3. Weekly missions definitions (admin-managed)
CREATE TABLE public.weekly_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  reward_points integer NOT NULL,
  mission_type text NOT NULL, -- 'consecutive_purchase', 'spend_amount', 'combo', 'referral'
  target_value jsonb NOT NULL DEFAULT '{}', -- e.g. {"category":"Ovos Caipira","weeks":2} or {"min_amount":120}
  week_start date NOT NULL,
  week_end date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.weekly_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active missions" ON public.weekly_missions
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage missions" ON public.weekly_missions
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. User mission progress
CREATE TABLE public.user_mission_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL REFERENCES public.weekly_missions(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  target integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id)
);
ALTER TABLE public.user_mission_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mission progress" ON public.user_mission_progress
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mission progress" ON public.user_mission_progress
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mission progress" ON public.user_mission_progress
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 5. Referrals system
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid,
  referred_email text,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'registered', 'first_purchase', 'second_purchase'
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert own referrals" ON public.referrals
FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update own referrals" ON public.referrals
FOR UPDATE TO authenticated USING (auth.uid() = referrer_id);

-- 6. Special events (admin-configurable)
CREATE TABLE public.special_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  event_type text NOT NULL, -- 'double_points', 'combo_bonus', 'monthly_challenge'
  config jsonb NOT NULL DEFAULT '{}', -- e.g. {"category":"Ovos Caipira","multiplier":2,"start_hour":14,"end_hour":16}
  bonus_points integer DEFAULT 0,
  target_points integer DEFAULT 0, -- for monthly challenge
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.special_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active events" ON public.special_events
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage events" ON public.special_events
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 7. Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_points integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available_cashback numeric NOT NULL DEFAULT 0;

-- Generate referral codes for existing profiles
UPDATE public.profiles SET referral_code = upper(substring(md5(random()::text) from 1 for 8)) WHERE referral_code IS NULL;

-- Function to generate referral code on new profile
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substring(md5(random()::text || NEW.user_id::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- Seed sample weekly missions for current week
INSERT INTO public.weekly_missions (title, description, reward_points, mission_type, target_value, week_start, week_end) VALUES
  ('Compre ovos 2 semanas seguidas', 'Compre ovos caipira por 2 semanas consecutivas', 2000, 'consecutive_purchase', '{"category":"Ovos Caipira","weeks":2}', date_trunc('week', now())::date, (date_trunc('week', now()) + interval '6 days')::date),
  ('Compra acima de R$120', 'Faça uma compra acima de R$120 esta semana', 3000, 'spend_amount', '{"min_amount":120}', date_trunc('week', now())::date, (date_trunc('week', now()) + interval '6 days')::date),
  ('Combo Roça + Carne', 'Compre 1 produto da roça e 1 carne na mesma semana', 4000, 'combo', '{"categories":["Produtos da Roça","Frango Caipira"]}', date_trunc('week', now())::date, (date_trunc('week', now()) + interval '6 days')::date),
  ('Indique 1 amigo', 'Indique um novo cliente que faça uma compra', 5000, 'referral', '{"count":1}', date_trunc('week', now())::date, (date_trunc('week', now()) + interval '6 days')::date);

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
-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

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

-- Add unique constraint for push_subscriptions upsert
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_user_endpoint_unique ON public.push_subscriptions (user_id, endpoint);

-- Allow users to update their own push subscriptions (needed for upsert)
CREATE POLICY "Users can update their own subscriptions"
  ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Add endereco and cep columns to partner_requests
ALTER TABLE public.partner_requests ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE public.partner_requests ADD COLUMN IF NOT EXISTS cep TEXT;

-- Allow admins to delete partner_requests
CREATE POLICY "Admins can delete partner requests"
  ON public.partner_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view purchase_history for dashboard
CREATE POLICY "Admins can view all purchases"
  ON public.purchase_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.produtos 
ADD COLUMN visivel_cliente boolean NOT NULL DEFAULT true,
ADD COLUMN visivel_parceiro boolean NOT NULL DEFAULT true;
ALTER TABLE public.produtos ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'sugestao',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'aberto',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own tickets" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all tickets" ON public.support_tickets
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for support images
INSERT INTO storage.buckets (id, name, public) VALUES ('support-images', 'support-images', true);

CREATE POLICY "Users can upload support images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'support-images');

CREATE POLICY "Anyone can view support images" ON storage.objects
  FOR SELECT USING (bucket_id = 'support-images');

CREATE TABLE public.admin_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own admin requests" ON public.admin_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own admin requests" ON public.admin_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all admin requests" ON public.admin_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin requests" ON public.admin_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admin requests" ON public.admin_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix ALL RLS policies: change from RESTRICTIVE to PERMISSIVE
-- The issue is that restrictive policies without any permissive policy deny everything

-- ====== admin_requests ======
DROP POLICY IF EXISTS "Users can insert own admin requests" ON public.admin_requests;
CREATE POLICY "Users can insert own admin requests" ON public.admin_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own admin requests" ON public.admin_requests;
CREATE POLICY "Users can view own admin requests" ON public.admin_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all admin requests" ON public.admin_requests;
CREATE POLICY "Admins can view all admin requests" ON public.admin_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update admin requests" ON public.admin_requests;
CREATE POLICY "Admins can update admin requests" ON public.admin_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete admin requests" ON public.admin_requests;
CREATE POLICY "Admins can delete admin requests" ON public.admin_requests FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== push_subscriptions ======
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON public.push_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ====== notifications ======
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ====== profiles ======
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== produtos ======
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.produtos;
CREATE POLICY "Authenticated users can view products" ON public.produtos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can insert products" ON public.produtos;
CREATE POLICY "Admins can insert products" ON public.produtos FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update products" ON public.produtos;
CREATE POLICY "Admins can update products" ON public.produtos FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete products" ON public.produtos;
CREATE POLICY "Admins can delete products" ON public.produtos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== purchase_history ======
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchase_history;
CREATE POLICY "Users can view their own purchases" ON public.purchase_history FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchase_history;
CREATE POLICY "Users can insert their own purchases" ON public.purchase_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchase_history;
CREATE POLICY "Admins can view all purchases" ON public.purchase_history FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== partner_requests ======
DROP POLICY IF EXISTS "Users can insert own partner requests" ON public.partner_requests;
CREATE POLICY "Users can insert own partner requests" ON public.partner_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own partner requests" ON public.partner_requests;
CREATE POLICY "Users can view own partner requests" ON public.partner_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all partner requests" ON public.partner_requests;
CREATE POLICY "Admins can view all partner requests" ON public.partner_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update partner requests" ON public.partner_requests;
CREATE POLICY "Admins can update partner requests" ON public.partner_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete partner requests" ON public.partner_requests;
CREATE POLICY "Admins can delete partner requests" ON public.partner_requests FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== partner_profiles ======
DROP POLICY IF EXISTS "Users can insert own partner profile" ON public.partner_profiles;
CREATE POLICY "Users can insert own partner profile" ON public.partner_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own partner profile" ON public.partner_profiles;
CREATE POLICY "Users can view own partner profile" ON public.partner_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own partner profile" ON public.partner_profiles;
CREATE POLICY "Users can update own partner profile" ON public.partner_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ====== support_tickets ======
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.support_tickets;
CREATE POLICY "Users can insert own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;
CREATE POLICY "Admins can update all tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== cashback_points ======
DROP POLICY IF EXISTS "Authenticated users can view ranking" ON public.cashback_points;
CREATE POLICY "Authenticated users can view ranking" ON public.cashback_points FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert their own points" ON public.cashback_points;
CREATE POLICY "Users can insert their own points" ON public.cashback_points FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own points" ON public.cashback_points;
CREATE POLICY "Users can update their own points" ON public.cashback_points FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ====== farm_points_monthly ======
DROP POLICY IF EXISTS "Anyone authenticated can view monthly ranking" ON public.farm_points_monthly;
CREATE POLICY "Anyone authenticated can view monthly ranking" ON public.farm_points_monthly FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own monthly points" ON public.farm_points_monthly;
CREATE POLICY "Users can insert own monthly points" ON public.farm_points_monthly FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own monthly points" ON public.farm_points_monthly;
CREATE POLICY "Users can update own monthly points" ON public.farm_points_monthly FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ====== referrals ======
DROP POLICY IF EXISTS "Users can insert own referrals" ON public.referrals;
CREATE POLICY "Users can insert own referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can update own referrals" ON public.referrals;
CREATE POLICY "Users can update own referrals" ON public.referrals FOR UPDATE TO authenticated USING (auth.uid() = referrer_id);

-- ====== category_multipliers ======
DROP POLICY IF EXISTS "Anyone authenticated can view multipliers" ON public.category_multipliers;
CREATE POLICY "Anyone authenticated can view multipliers" ON public.category_multipliers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage multipliers" ON public.category_multipliers;
CREATE POLICY "Admins can manage multipliers" ON public.category_multipliers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== special_events ======
DROP POLICY IF EXISTS "Anyone authenticated can view active events" ON public.special_events;
CREATE POLICY "Anyone authenticated can view active events" ON public.special_events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage events" ON public.special_events;
CREATE POLICY "Admins can manage events" ON public.special_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== weekly_missions ======
DROP POLICY IF EXISTS "Anyone authenticated can view active missions" ON public.weekly_missions;
CREATE POLICY "Anyone authenticated can view active missions" ON public.weekly_missions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage missions" ON public.weekly_missions;
CREATE POLICY "Admins can manage missions" ON public.weekly_missions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== user_mission_progress ======
DROP POLICY IF EXISTS "Users can insert own mission progress" ON public.user_mission_progress;
CREATE POLICY "Users can insert own mission progress" ON public.user_mission_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own mission progress" ON public.user_mission_progress;
CREATE POLICY "Users can view own mission progress" ON public.user_mission_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mission progress" ON public.user_mission_progress;
CREATE POLICY "Users can update own mission progress" ON public.user_mission_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ====== user_roles ======
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ====== user_subscriptions ======
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow admins to delete user_roles (for revoking admin access)
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update user_roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
-- Add whatsapp column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Update the handle_new_user trigger to include whatsapp and auto-admin logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, whatsapp)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'whatsapp'
  );
  
  -- Create welcome notification
  INSERT INTO public.notifications (user_id, title, message)
  VALUES (NEW.id, '🌿 Bem-vindo ao Recanto das Flores!', 'Seja bem-vindo! Explore nossos produtos frescos direto da granja para sua mesa. Aproveite nossas ofertas e assinaturas!');

  -- Auto-assign admin role to specific emails
  IF NEW.email IN ('hudsonraonefotografia@gmail.com', 'joanadaarcjesuscosta@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
