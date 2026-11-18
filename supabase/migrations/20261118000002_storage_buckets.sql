-- Buckets de Storage usados pelo app (não existiam em produção, então todo upload falhava).
-- Idempotente.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('produtos', 'produtos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('support-images', 'support-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('momentos', 'momentos', true, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Leitura pública (as URLs são exibidas no app)
DROP POLICY IF EXISTS "Public read app buckets" ON storage.objects;
CREATE POLICY "Public read app buckets" ON storage.objects
  FOR SELECT USING (bucket_id IN ('produtos', 'avatars', 'support-images', 'momentos'));

-- produtos: só admin envia/altera/remove
DROP POLICY IF EXISTS "Admins manage produtos images" ON storage.objects;
CREATE POLICY "Admins manage produtos images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'produtos' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (bucket_id = 'produtos' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- avatars, support-images, momentos: cada usuário mexe só na própria pasta (<user_id>/arquivo)
DROP POLICY IF EXISTS "Users manage own folder" ON storage.objects;
CREATE POLICY "Users manage own folder" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id IN ('avatars', 'support-images', 'momentos') AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id IN ('avatars', 'support-images', 'momentos') AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin pode remover momentos de qualquer usuário (moderação)
DROP POLICY IF EXISTS "Admins delete momentos" ON storage.objects;
CREATE POLICY "Admins delete momentos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'momentos' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
