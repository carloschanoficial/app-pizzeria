/*
# Subscription plan requests with required payment ticket

Lets an administrator whose access is expired, inactive, or not yet granted request a subscription plan by uploading a photo of their payment ticket.

1. New table
- `solicitudes_plan`: one row per plan request.
  - `id` (uuid, primary key)
  - `email` (text, lowercase email of the requesting account)
  - `plan_id` (uuid, references `planes_suscripcion`, required)
  - `ticket_path` (text, required): path of the ticket image in the `comprobantes` bucket
  - `status` (text): `pendiente`, `aprobada` or `rechazada`; defaults to `pendiente`
  - `created_at` (timestamptz)
  - `reviewed_at` (timestamptz, empty until the super administrator reviews it)

2. New storage bucket
- `comprobantes`: private bucket for payment ticket images. Accepts JPEG, PNG and WebP files up to 5 MB.

3. Security
- Row level security enabled on `solicitudes_plan`; anonymous visitors have no access.
- Any signed-in account can create a request only for its own email, only as `pendiente`, and only for an active plan.
- Signed-in accounts can read only their own requests; the super administrator can read all of them.
- Only the super administrator can change a request's status (approve or reject).
- Files in `comprobantes` are stored in a folder named after the requester's email. Users can upload and read only inside their own folder; the super administrator can read every ticket.
- Signed-in accounts can now read active plans (`is_active = true`) so they can choose one. Inactive plans stay restricted to the super administrator.

4. Notes
- Existing tables, orders, loyalty and wallet data are not changed.
- Approving a request does not extend the subscription automatically; the super administrator still updates the administrator's expiry date.
*/

CREATE TABLE IF NOT EXISTS solicitudes_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (email = lower(email)),
  plan_id uuid NOT NULL REFERENCES planes_suscripcion(id),
  ticket_path text NOT NULL,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_plan_email ON solicitudes_plan (email);
CREATE INDEX IF NOT EXISTS idx_solicitudes_plan_status ON solicitudes_plan (status);

ALTER TABLE solicitudes_plan ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON solicitudes_plan FROM anon;
GRANT SELECT, INSERT ON solicitudes_plan TO authenticated;
GRANT UPDATE (status, reviewed_at) ON solicitudes_plan TO authenticated;

DROP POLICY IF EXISTS "select_own_or_super_solicitudes_plan" ON solicitudes_plan;
CREATE POLICY "select_own_or_super_solicitudes_plan" ON solicitudes_plan FOR SELECT
  TO authenticated
  USING (email = lower(coalesce(auth.jwt() ->> 'email', '')) OR public.is_super_admin());

DROP POLICY IF EXISTS "insert_own_solicitudes_plan" ON solicitudes_plan;
CREATE POLICY "insert_own_solicitudes_plan" ON solicitudes_plan FOR INSERT
  TO authenticated
  WITH CHECK (
    email = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND status = 'pendiente'
    AND reviewed_at IS NULL
    AND EXISTS (
      SELECT 1 FROM planes_suscripcion p
      WHERE p.id = plan_id AND p.is_active
    )
  );

DROP POLICY IF EXISTS "update_super_solicitudes_plan" ON solicitudes_plan;
CREATE POLICY "update_super_solicitudes_plan" ON solicitudes_plan FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "select_active_planes_authenticated" ON planes_suscripcion;
CREATE POLICY "select_active_planes_authenticated" ON planes_suscripcion FOR SELECT
  TO authenticated
  USING (is_active);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('comprobantes', 'comprobantes', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "insert_own_comprobantes" ON storage.objects;
CREATE POLICY "insert_own_comprobantes" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'comprobantes'
    AND (storage.foldername(name))[1] = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "select_own_or_super_comprobantes" ON storage.objects;
CREATE POLICY "select_own_or_super_comprobantes" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'comprobantes'
    AND ((storage.foldername(name))[1] = lower(coalesce(auth.jwt() ->> 'email', '')) OR public.is_super_admin())
  );
