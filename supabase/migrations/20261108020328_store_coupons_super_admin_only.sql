/*
# Discount coupons managed by the super administrator

1. New table
- `cupones_descuento`: discount codes for customers.
  - `id` (uuid, primary key)
  - `codigo` (text, unique, stored in uppercase, 3 to 32 characters)
  - `descuento_porcentaje` (integer, 1 to 100)
  - `is_active` (boolean, default true): manual on/off switch
  - `created_at` (timestamptz)

2. New function
- `validate_coupon(p_codigo)`: given a code, returns its discount percentage when the code exists and is active, or nothing otherwise. It reveals only that one value, never the list of codes.

3. Security
- Row level security enabled on `cupones_descuento`.
- Anonymous visitors have no direct access to the table, so codes cannot be listed.
- Only the super administrator can read, create, or change coupons. There is no delete permission; coupons are switched off with `is_active`.
- `validate_coupon` is the only path customers can use, and it runs with restricted rights.

4. Notes
- Existing tables, functions, and data are not modified.
*/

CREATE TABLE IF NOT EXISTS cupones_descuento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE CHECK (codigo = upper(codigo) AND char_length(codigo) BETWEEN 3 AND 32),
  descuento_porcentaje integer NOT NULL CHECK (descuento_porcentaje BETWEEN 1 AND 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cupones_descuento ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON cupones_descuento FROM anon;
GRANT SELECT, INSERT, UPDATE ON cupones_descuento TO authenticated;

DROP POLICY IF EXISTS "select_super_cupones" ON cupones_descuento;
CREATE POLICY "select_super_cupones" ON cupones_descuento FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "insert_super_cupones" ON cupones_descuento;
CREATE POLICY "insert_super_cupones" ON cupones_descuento FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "update_super_cupones" ON cupones_descuento;
CREATE POLICY "update_super_cupones" ON cupones_descuento FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE OR REPLACE FUNCTION public.validate_coupon(p_codigo text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT c.descuento_porcentaje
  FROM public.cupones_descuento c
  WHERE c.codigo = upper(btrim(p_codigo))
    AND c.is_active
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.validate_coupon(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated;
