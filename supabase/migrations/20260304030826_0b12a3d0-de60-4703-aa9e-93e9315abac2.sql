
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
