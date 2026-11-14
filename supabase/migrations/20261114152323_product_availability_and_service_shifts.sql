/*
# Product availability and service shifts (menus)

1. New table
- `service_shifts`: named menus or shifts (for example "Pizzas" or "Comida Casera").
  - `id` (uuid, primary key)
  - `name` (text, required)
  - `is_active` (boolean, default true): when false, its products are hidden from the public menu.
  - `sort_order` (integer, default 0)
  - `created_at` (timestamp)

2. Modified table: `products`
- `is_available` (boolean, not null, default true): when false the product stays visible but is marked as sold out.
- `shift_id` (uuid, nullable): links the product to a service shift. Products without a shift are always shown.
  Deleting a shift is not allowed from the app; if a shift were removed, its products would be unlinked (set to null).

3. Security
- `service_shifts` has row level security enabled.
- Anonymous visitors and signed-in users can read shifts (the public menu needs them).
- Only the super administrator can create, edit or change shifts (`public.is_super_admin()`).
- No delete grant on shifts.
- Product columns use the existing product write policies, which already restrict writes to the store administrator.

4. Notes
- Existing products are not modified: they default to available and without a shift.
- The migration is idempotent and can be re-run safely.
*/

CREATE TABLE IF NOT EXISTS service_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE service_shifts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON service_shifts TO anon, authenticated;
GRANT INSERT, UPDATE ON service_shifts TO authenticated;

DROP POLICY IF EXISTS "public_select_service_shifts" ON service_shifts;
CREATE POLICY "public_select_service_shifts" ON service_shifts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "super_insert_service_shifts" ON service_shifts;
CREATE POLICY "super_insert_service_shifts" ON service_shifts FOR INSERT
  TO authenticated WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "super_update_service_shifts" ON service_shifts;
CREATE POLICY "super_update_service_shifts" ON service_shifts FOR UPDATE
  TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES service_shifts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS products_shift_id_idx ON products (shift_id);
