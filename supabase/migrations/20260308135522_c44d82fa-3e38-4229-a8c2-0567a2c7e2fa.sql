
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
