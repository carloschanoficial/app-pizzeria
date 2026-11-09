/*
# Pizzería Matias - Lealtad, Banners, Horario Inteligente

## Descripción
Añade tablas para el programa de lealtad (6 sellos) y banners promocionales manuales.
Añade settings para control manual de apertura y horario automático.

## Tablas nuevas
1. `promo_banners` - Banners promocionales del inicio (CRUD manual desde admin)
   - id (uuid, PK), title (text), subtitle (text), image_url (text),
     bg_gradient (text, default gradient), sort_order (int), is_active (bool)
2. `loyalty_cards` - Tarjeta digital de lealtad del cliente (identificada por teléfono)
   - id (uuid, PK), customer_phone (text, unique), stamps (int, default 0, 0-6),
     reward_claimed (bool, default false), created_at (timestamptz)

## Cambios a store_settings
- Nuevas claves: manual_override (auto/manual), manual_is_open (true/false)
- El horario automático es Vie-Dom 1PM-10PM (calculado en frontend)
- Se mantiene exchange_rate_usd en la tabla pero se deja de usar en el frontend

## Seguridad
- RLS habilitado en ambas tablas nuevas con CRUD para anon + authenticated
*/

-- ============================================================
-- PROMO BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS promo_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  bg_gradient text NOT NULL DEFAULT 'from-orange-500 to-red-500',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE promo_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_banners" ON promo_banners;
CREATE POLICY "anon_select_banners" ON promo_banners FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_banners" ON promo_banners;
CREATE POLICY "anon_insert_banners" ON promo_banners FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_banners" ON promo_banners;
CREATE POLICY "anon_update_banners" ON promo_banners FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_banners" ON promo_banners;
CREATE POLICY "anon_delete_banners" ON promo_banners FOR DELETE
TO anon, authenticated USING (true);

-- ============================================================
-- LOYALTY CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS loyalty_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone text UNIQUE NOT NULL,
  stamps int NOT NULL DEFAULT 0,
  reward_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_loyalty" ON loyalty_cards;
CREATE POLICY "anon_select_loyalty" ON loyalty_cards FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_loyalty" ON loyalty_cards;
CREATE POLICY "anon_insert_loyalty" ON loyalty_cards FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_loyalty" ON loyalty_cards;
CREATE POLICY "anon_update_loyalty" ON loyalty_cards FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_loyalty" ON loyalty_cards;
CREATE POLICY "anon_delete_loyalty" ON loyalty_cards FOR DELETE
TO anon, authenticated USING (true);

-- ============================================================
-- NUEVAS CONFIGURACIONES
-- ============================================================
INSERT INTO store_settings (key, value) VALUES
('manual_override', 'auto'),
('manual_is_open', 'true')
ON CONFLICT (key) DO NOTHING;

-- Datos iniciales de banners
INSERT INTO promo_banners (title, subtitle, bg_gradient, sort_order, is_active) VALUES
('Combos Familiares', '2 pizzas grandes + bebida desde $299', 'from-orange-500 to-red-500', 1, true),
('Envío Gratis', 'En pedidos mayores a $350', 'from-green-500 to-teal-600', 2, true),
('Más Vendidas', 'Las favoritas de nuestros clientes', 'from-red-500 to-rose-600', 3, true),
('Hasta 20% de Descuento', 'En pizzas seleccionadas esta semana', 'from-amber-500 to-orange-600', 4, true)
ON CONFLICT DO NOTHING;
