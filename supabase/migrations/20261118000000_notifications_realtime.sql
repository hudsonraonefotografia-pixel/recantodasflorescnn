-- Habilita realtime para notificações (sino do app atualiza na hora)
-- e para purchase_history (banner de rastreamento do pedido)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'purchase_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_history;
  END IF;
END $$;
