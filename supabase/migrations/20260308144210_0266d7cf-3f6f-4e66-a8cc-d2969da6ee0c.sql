
ALTER TABLE public.produtos 
ADD COLUMN visivel_cliente boolean NOT NULL DEFAULT true,
ADD COLUMN visivel_parceiro boolean NOT NULL DEFAULT true;
