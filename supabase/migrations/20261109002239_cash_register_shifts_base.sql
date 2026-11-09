/*
# Cash register shifts (base data structure)

1. New Tables
- `cash_register_shifts`: one row per cash register shift ("Corte de Caja").
  - `id` (uuid, primary key)
  - `opening_float` (numeric, starting cash "Fondo inicial", never negative)
  - `cash_sales` (numeric, running total of cash sales for the shift, starts at 0, never negative)
  - `status` ('open' or 'closed')
  - `opened_at` (timestamp, when the shift was opened)
  - `closed_at` (timestamp, nullable until the shift is closed)
  - `created_at` (timestamp)

2. Security
- Enable RLS on `cash_register_shifts`.
- Grant SELECT, INSERT, UPDATE to `authenticated` only (no anonymous access).
- Policies restrict every operation to the store administrator via `public.is_store_admin()`.

3. Notes
- No reports or UI are created by this migration; it only prepares the data structure.
- No rows are deleted or modified in existing tables.
*/

CREATE TABLE IF NOT EXISTS public.cash_register_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_float numeric(10,2) NOT NULL DEFAULT 0 CHECK (opening_float >= 0),
  cash_sales numeric(10,2) NOT NULL DEFAULT 0 CHECK (cash_sales >= 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cash_register_shifts_status_opened_idx
  ON public.cash_register_shifts (status, opened_at DESC);

ALTER TABLE public.cash_register_shifts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.cash_register_shifts TO authenticated;

DROP POLICY IF EXISTS "admin_select_cash_shifts" ON public.cash_register_shifts;
CREATE POLICY "admin_select_cash_shifts" ON public.cash_register_shifts
  FOR SELECT TO authenticated USING (public.is_store_admin());

DROP POLICY IF EXISTS "admin_insert_cash_shifts" ON public.cash_register_shifts;
CREATE POLICY "admin_insert_cash_shifts" ON public.cash_register_shifts
  FOR INSERT TO authenticated WITH CHECK (public.is_store_admin());

DROP POLICY IF EXISTS "admin_update_cash_shifts" ON public.cash_register_shifts;
CREATE POLICY "admin_update_cash_shifts" ON public.cash_register_shifts
  FOR UPDATE TO authenticated USING (public.is_store_admin()) WITH CHECK (public.is_store_admin());
