
-- Add unique constraint for push_subscriptions upsert
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_user_endpoint_unique ON public.push_subscriptions (user_id, endpoint);
