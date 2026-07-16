
-- Create produtos table for barcode/QR scanning
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0,
  categoria TEXT,
  validade DATE,
  lote TEXT,
  codigo_barras TEXT UNIQUE,
  qr_code_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable (anyone logged in can see them)
CREATE POLICY "Authenticated users can view products"
ON public.produtos FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage products
CREATE POLICY "Admins can insert products"
ON public.produtos FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products"
ON public.produtos FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products"
ON public.produtos FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
