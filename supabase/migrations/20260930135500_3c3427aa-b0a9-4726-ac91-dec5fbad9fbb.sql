CREATE TABLE public.productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_barras TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ventas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  pagado NUMERIC(10,2),
  vuelto NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.detalle_ventas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  codigo_barras TEXT NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  cantidad INTEGER NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_detalle_ventas_venta ON public.detalle_ventas(venta_id);
CREATE INDEX idx_productos_nombre ON public.productos(lower(nombre));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.productos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ventas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detalle_ventas TO anon, authenticated;
GRANT ALL ON public.productos TO service_role;
GRANT ALL ON public.ventas TO service_role;
GRANT ALL ON public.detalle_ventas TO service_role;

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "productos_publico" ON public.productos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ventas_publico" ON public.ventas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "detalle_ventas_publico" ON public.detalle_ventas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER productos_updated_at BEFORE UPDATE ON public.productos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.productos (codigo_barras, nombre, precio, stock) VALUES
  ('7750670001234', 'Inca Kola 500 ml', 3.50, 24),
  ('7750885001112', 'Galleta Soda Field', 1.20, 40),
  ('7751271002233', 'Leche Gloria Evaporada', 4.80, 18),
  ('7750243003344', 'Arroz Costeño 1 kg', 5.20, 30),
  ('7751158004455', 'Aceite Primor 1 L', 12.90, 12),
  ('7750182005566', 'Azúcar Rubia 1 kg', 4.50, 20),
  ('7751468006677', 'Atún Florida en aceite', 6.30, 15),
  ('7750106007788', 'Fideo Don Vittorio 500 g', 4.10, 25),
  ('7751234008899', 'Chocolate Sublime', 2.00, 36),
  ('7750670009900', 'Agua San Luis 625 ml', 1.80, 48);