/*
# Administrator subscriptions with expiry and access control

1. New table
- `administradores`: one row per store administrator.
  - `id` (uuid, primary key)
  - `email` (text, unique, stored in lowercase)
  - `expires_at` (timestamptz, required): when the subscription ends
  - `is_active` (boolean, default true): manual on/off switch
  - `created_at` (timestamptz)

2. Functions
- `is_super_admin()`: true only for the super administrator account (carloschan1890@gmail.com).
- `is_store_admin()` now returns true for the super administrator, or for a signed-in user whose row in `administradores` is active and whose `expires_at` is still in the future. The catalog write policies already use this function, so expired administrators lose write access automatically.

3. Security
- Row level security enabled on `administradores`.
- Authenticated users can read only their own row; the super administrator can read all rows.
- Only the super administrator can insert or update rows. There is no delete permission, so access is revoked by switching `is_active` off.
- Anonymous visitors have no access to the table.

4. Notes
- The super administrator is never blocked by the expiry date.
- Existing tables and data are not modified.
*/

CREATE TABLE IF NOT EXISTS administradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON administradores FROM anon;
GRANT SELECT, INSERT, UPDATE ON administradores TO authenticated;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'carloschan1890@gmail.com'
$$;

CREATE OR REPLACE FUNCTION public.is_store_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.administradores a
      WHERE a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
        AND a.is_active
        AND a.expires_at > now()
    )
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

DROP POLICY IF EXISTS "select_own_or_super_administradores" ON administradores;
CREATE POLICY "select_own_or_super_administradores" ON administradores FOR SELECT
  TO authenticated
  USING (email = lower(coalesce(auth.jwt() ->> 'email', '')) OR public.is_super_admin());

DROP POLICY IF EXISTS "insert_super_administradores" ON administradores;
CREATE POLICY "insert_super_administradores" ON administradores FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "update_super_administradores" ON administradores;
CREATE POLICY "update_super_administradores" ON administradores FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
