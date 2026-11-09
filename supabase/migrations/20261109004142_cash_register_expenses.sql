/*
# Cash register expenses

1. New Tables
- `cash_register_expenses`: operating expenses paid during a cash register shift (for example "1 Cebolla" for $10).
  - `id` (uuid, primary key)
  - `shift_id` (uuid, references the shift the expense belongs to)
  - `description` (text, required, what was bought)
  - `amount` (numeric, required, greater than 0)
  - `created_at` (timestamp)

2. Security
- Enable RLS on `cash_register_expenses`.
- Grant SELECT and INSERT to `authenticated` only. Expenses cannot be edited or deleted from the app.
- Only the store administrator can read or add expenses, and only while the shift is open.

3. Notes
- No existing tables are modified or deleted.
- Expenses are subtracted from the expected cash in the UI and reports; they are not stored as a total on the shift.
*/

CREATE TABLE IF NOT EXISTS public.cash_register_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES public.cash_register_shifts(id),
  description text NOT NULL CHECK (char_length(btrim(description)) > 0),
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cash_register_expenses_shift_idx
  ON public.cash_register_expenses (shift_id, created_at);

ALTER TABLE public.cash_register_expenses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.cash_register_expenses TO authenticated;

DROP POLICY IF EXISTS "admin_select_cash_expenses" ON public.cash_register_expenses;
CREATE POLICY "admin_select_cash_expenses" ON public.cash_register_expenses
  FOR SELECT TO authenticated USING (public.is_store_admin());

DROP POLICY IF EXISTS "admin_insert_cash_expenses" ON public.cash_register_expenses;
CREATE POLICY "admin_insert_cash_expenses" ON public.cash_register_expenses
  FOR INSERT TO authenticated WITH CHECK (
    public.is_store_admin()
    AND EXISTS (
      SELECT 1 FROM public.cash_register_shifts s
      WHERE s.id = shift_id AND s.status = 'open'
    )
  );
