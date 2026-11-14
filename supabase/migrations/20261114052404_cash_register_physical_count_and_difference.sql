/*
# Cash register physical count and difference

Plain-English summary
When a cash register shift is closed, the store now records the physical cash counted (by bills and coins), the expected cash at closing time, and the final difference (shortage or surplus).

1. Modified table: cash_register_shifts
- `expected_cash` (numeric, nullable): expected cash at closing = opening float + cash sales - shift expenses. Stored as a snapshot when the shift closes.
- `counted_cash` (numeric, nullable, never negative): total physically counted cash at closing. Empty for shifts closed before this change and for shifts still open.
- `cash_difference` (numeric, nullable): counted cash minus expected cash. Negative means shortage (faltante), positive means surplus (sobrante).
- `cash_count` (jsonb, nullable): breakdown of bills and coins, keyed by denomination, e.g. {"500": 2, "20": 5}.

2. Security
- No policies, grants, or tables change. The existing store administrator update rules already cover these columns.

3. Notes
- No rows are deleted or modified. Existing shifts keep empty count fields.
*/

ALTER TABLE public.cash_register_shifts ADD COLUMN IF NOT EXISTS expected_cash numeric(10,2);
ALTER TABLE public.cash_register_shifts ADD COLUMN IF NOT EXISTS counted_cash numeric(10,2);
ALTER TABLE public.cash_register_shifts ADD COLUMN IF NOT EXISTS cash_difference numeric(10,2);
ALTER TABLE public.cash_register_shifts ADD COLUMN IF NOT EXISTS cash_count jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cash_register_shifts_counted_cash_check'
  ) THEN
    ALTER TABLE public.cash_register_shifts
      ADD CONSTRAINT cash_register_shifts_counted_cash_check CHECK (counted_cash IS NULL OR counted_cash >= 0);
  END IF;
END $$;
