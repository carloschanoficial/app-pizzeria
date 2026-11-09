/*
# Pizzería Matias - Schema inicial

## Descripción
Crea el esquema completo de la base de datos para la app de pedidos de Pizzería Matias.
Es una app sin autenticación (single-tenant), por lo que las políticas permiten acceso anónimo.

## Tablas nuevas
1. `categories` - Categorías de productos (pizzas, bebidas, complementos)
   - id (uuid, PK), name (text), slug (text, unique), sort_order (int), icon_name (text)
2. `products` - Productos del menú (pizzas, bebidas, complementos)
   - id (uuid, PK), category_id (FK -> categories), name (text), description (text),
   - image_url (text), base_price (numeric), sizes (jsonb), discount_percent (int, default 0),
   - is_bestseller (bool, default false), is_active (bool, default true), sort_order (int)
   - El campo `sizes` para pizzas contiene: {"chica": 0, "mediana": 30, "grande": 60}
     donde el valor es el incremento sobre el precio base.
3. `extra_ingredients` - Ingredientes extra disponibles para personalizar pizzas
   - id (uuid, PK), name (text), price (numeric, default 15), is_active (bool, default true)
4. `store_settings` - Configuración de la pizzería (clave-valor)
   - id (uuid, PK), key (text, unique), value (text)
   - Claves: whatsapp_number, delivery_cost, is_open, address, schedule
5. `orders` - Pedidos de clientes (para la pestaña "Mis Pedidos")
   - id (uuid, PK), customer_name (text), customer_phone (text), customer_address (text),
   - items (jsonb), subtotal (numeric), delivery_cost (numeric), total (numeric),
   - status (text, default 'pendiente'), created_at (timestamptz)

## Seguridad
- RLS habilitado en todas las tablas.
- Políticas de CRUD para anon + authenticated en todas las tablas (app sin login).
- El panel admin se protege con un código en el frontend, no a nivel de base de datos
  (es una pizzería local; los datos del menú son públicos de todas formas).

## Datos iniciales
- Categorías: pizzas, bebidas, complementos
- 6 pizzas con imágenes reales
- 3 bebidas
- 3 complementos
- 8 ingredientes extra a $15 c/u
- Configuración de la tienda (WhatsApp, envío, etc.)
*/

-- ============================================================
-- CATEGORÍAS
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
TO anon, authenticated USING (true);

-- ============================================================
-- PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  sizes jsonb,
  discount_percent int NOT NULL DEFAULT 0,
  is_bestseller boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
TO anon, authenticated USING (true);

-- ============================================================
-- INGREDIENTES EXTRA
-- ============================================================
CREATE TABLE IF NOT EXISTS extra_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 15,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE extra_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_extras" ON extra_ingredients;
CREATE POLICY "anon_select_extras" ON extra_ingredients FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_extras" ON extra_ingredients;
CREATE POLICY "anon_insert_extras" ON extra_ingredients FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_extras" ON extra_ingredients;
CREATE POLICY "anon_update_extras" ON extra_ingredients FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_extras" ON extra_ingredients;
CREATE POLICY "anon_delete_extras" ON extra_ingredients FOR DELETE
TO anon, authenticated USING (true);

-- ============================================================
-- CONFIGURACIÓN DE TIENDA
-- ============================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON store_settings;
CREATE POLICY "anon_select_settings" ON store_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON store_settings;
CREATE POLICY "anon_insert_settings" ON store_settings FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON store_settings;
CREATE POLICY "anon_update_settings" ON store_settings FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON store_settings;
CREATE POLICY "anon_delete_settings" ON store_settings FOR DELETE
TO anon, authenticated USING (true);

-- ============================================================
-- PEDIDOS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text,
  customer_phone text,
  customer_address text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  delivery_cost numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
TO anon, authenticated USING (true);

-- ============================================================
-- DATOS INICIALES
-- ============================================================
INSERT INTO categories (name, slug, sort_order) VALUES
('Pizzas', 'pizzas', 1),
('Bebidas', 'bebidas', 2),
('Complementos', 'complementos', 3)
ON CONFLICT (slug) DO NOTHING;

-- Pizzas
INSERT INTO products (category_id, name, description, image_url, base_price, sizes, discount_percent, is_bestseller, sort_order) VALUES
(
  (SELECT id FROM categories WHERE slug = 'pizzas'),
  'Pizza Margarita',
  'Salsa de tomate, mozzarella fresca y albahaca.',
  'https://images.pexels.com/photos/28945103/pexels-photo-28945103.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  120.00,
  '{"chica": 0, "mediana": 30, "grande": 60}'::jsonb,
  0, true, 1
),
(
  (SELECT id FROM categories WHERE slug = 'pizzas'),
  'Pizza Pepperoni',
  'Clásica pepperoni con extra queso derretido.',
  'https://images.pexels.com/photos/29829308/pexels-photo-29829308.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  140.00,
  '{"chica": 0, "mediana": 35, "grande": 65}'::jsonb,
  10, true, 2
),
(
  (SELECT id FROM categories WHERE slug = 'pizzas'),
  'Pizza Cuatro Quesos',
  'Mozzarella, parmesano, gorgonzola y provolone.',
  'https://images.pexels.com/photos/2762939/pexels-photo-2762939.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  150.00,
  '{"chica": 0, "mediana": 35, "grande": 70}'::jsonb,
  0, false, 3
),
(
  (SELECT id FROM categories WHERE slug = 'pizzas'),
  'Pizza Vegetariana',
  'Champiñones, pimientos, cebolla, aceitunas y tomate.',
  'https://images.pexels.com/photos/8609973/pexels-photo-8609973.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  135.00,
  '{"chica": 0, "mediana": 32, "grande": 62}'::jsonb,
  15, false, 4
),
(
  (SELECT id FROM categories WHERE slug = 'pizzas'),
  'Pizza de Tocino',
  'Tocino crujiente, mozzarella y salsa de tomate.',
  'https://images.pexels.com/photos/30343607/pexels-photo-30343607.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  155.00,
  '{"chica": 0, "mediana": 35, "grande": 70}'::jsonb,
  0, true, 5
),
(
  (SELECT id FROM categories WHERE slug = 'pizzas'),
  'Pizza Especial de la Casa',
  'Pepperoni, champiñones, pimientos y aceitunas.',
  'https://images.pexels.com/photos/11111603/pexels-photo-11111603.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  165.00,
  '{"chica": 0, "mediana": 38, "grande": 75}'::jsonb,
  20, false, 6
);

-- Bebidas (sin tamaños, precio único)
INSERT INTO products (category_id, name, description, image_url, base_price, discount_percent, is_bestseller, sort_order) VALUES
(
  (SELECT id FROM categories WHERE slug = 'bebidas'),
  'Refresco de Cola 600ml',
  'Refresco frío de cola, botella 600ml.',
  'https://images.pexels.com/photos/17650224/pexels-photo-17650224.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  25.00, 0, true, 1
),
(
  (SELECT id FROM categories WHERE slug = 'bebidas'),
  'Limonada Natural',
  'Limonada fresca recién preparada.',
  'https://images.pexels.com/photos/15823325/pexels-photo-15823325.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  30.00, 0, false, 2
),
(
  (SELECT id FROM categories WHERE slug = 'bebidas'),
  'Refresco en Lata',
  'Variedad de refrescos en lata 355ml.',
  'https://images.pexels.com/photos/34405414/pexels-photo-34405414.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  20.00, 5, false, 3
);

-- Complementos
INSERT INTO products (category_id, name, description, image_url, base_price, discount_percent, is_bestseller, sort_order) VALUES
(
  (SELECT id FROM categories WHERE slug = 'complementos'),
  'Alitas BBQ (6 piezas)',
  'Alitas de pollo glaseadas con salsa BBQ.',
  'https://images.pexels.com/photos/5946433/pexels-photo-5946433.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  85.00, 0, true, 1
),
(
  (SELECT id FROM categories WHERE slug = 'complementos'),
  'Pan de Ajo con Queso',
  'Pan crujiente con mantequilla de ajo y queso derretido.',
  'https://images.pexels.com/photos/9951852/pexels-photo-9951852.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  55.00, 0, false, 2
),
(
  (SELECT id FROM categories WHERE slug = 'complementos'),
  'Alitas Sesame (8 piezas)',
  'Alitas de pollo con semillas de sésamo y dip.',
  'https://images.pexels.com/photos/27758752/pexels-photo-27758752.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  99.00, 10, false, 3
);

-- Ingredientes extra
INSERT INTO extra_ingredients (name, price, is_active, sort_order) VALUES
('Queso Extra', 15.00, true, 1),
('Pepperoni Extra', 15.00, true, 2),
('Champiñones', 15.00, true, 3),
('Tocino', 15.00, true, 4),
('Pimientos', 15.00, true, 5),
('Cebolla', 15.00, true, 6),
('Aceitunas', 15.00, true, 7),
('Piña', 15.00, true, 8)
ON CONFLICT DO NOTHING;

-- Configuración de tienda
INSERT INTO store_settings (key, value) VALUES
('whatsapp_number', '525500000000'),
('delivery_cost', '30'),
('is_open', 'true'),
('address', 'Av. Reforma 123, Ciudad de México'),
('schedule', 'Lun a Dom, 12:00 PM - 11:00 PM'),
('admin_code', 'matias2024')
ON CONFLICT (key) DO NOTHING;
