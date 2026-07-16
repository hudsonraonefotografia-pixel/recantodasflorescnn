
-- Update handle_new_user to also invoke send-push via pg_net (optional, won't break if not available)
-- For now, the push will be triggered from the application code when new notifications are created

-- Add an index for faster push subscription lookups
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
