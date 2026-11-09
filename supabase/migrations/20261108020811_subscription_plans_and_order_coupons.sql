/*
# Subscription plans and coupon fields on orders

1. New table
- `planes_suscripcion`: plans the store offers to administrators.
  - `id` (uuid, primary key)
  - `nombre` (text, required)
  - `duracion_dias` (integer, required, greater than 0): length of the plan in days
  - `precio` (numeric, required, 0 or more)
  - `descuento_porcentaje` (integer, 0 to 100, default 0)
  - `es_prueba` (boolean, default false): free trial plan
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)

2. Modified table
- `orders`: three optional columns added to record a coupon used at checkout.
  - `coupon_code` (text)
  - `coupon_discount_percent` (integer)
  - `coupon_discount_amount` (numeric)
  Existing orders keep null values in these columns.

3. Security
- Row level security enabled on `planes_suscripcion`.
- Anonymous visitors have no access to plans.
- Only the super administrator can read, create, or change plans. There is no delete permission; plans are switched off with `is_active`.

4. Notes
- No existing data or policies are changed.
*/

CREATE TABLE IF NOT EXISTS planes_suscripcion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  duracion_dias integer NOT NULL CHECK (duracion_dias > 0),
  precio numeric NOT NULL CHECK (precio >= 0),
  descuento_porcentaje integer NOT NULL DEFAULT 0 CHECK (descuento_porcentaje BETWEEN 0 AND 100),
  es_prueba boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE planes_suscripcion ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON planes_suscripcion FROM anon;
GRANT SELECT, INSERT, UPDATE ON planes_suscripcion TO authenticated;

DROP POLICY IF EXISTS "select_super_planes" ON planes_suscripcion;
CREATE POLICY "select_super_planes" ON planes_suscripcion FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "insert_super_planes" ON planes_suscripcion;
CREATE POLICY "insert_super_planes" ON planes_suscripcion FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "update_super_planes" ON planes_suscripcion;
CREATE POLICY "update_super_planes" ON planes_suscripcion FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_percent integer;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_amount numeric;
