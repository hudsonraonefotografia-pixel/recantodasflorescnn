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
