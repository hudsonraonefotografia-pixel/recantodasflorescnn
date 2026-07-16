
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
