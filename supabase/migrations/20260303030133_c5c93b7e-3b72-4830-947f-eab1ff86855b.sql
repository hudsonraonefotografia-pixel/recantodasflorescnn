
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
