/*
# Link orders to the open cash register shift

1. Modified Tables
- `orders`: new column `shift_id` (uuid, nullable). It stores the cash register shift that was open when the order was placed.

2. Automatic behavior (database trigger)
- When a new order is inserted, the database looks up the currently open shift and writes its id into `shift_id`. Orders placed while no shift is open keep `shift_id` empty.
- When that order is paid in cash (`payment_method = 'efectivo'`), its total is added to the shift's `cash_sales` running total.
- Customers do not need access to the shifts table: the lookup runs with the function owner's rights and is not callable by customers directly.

3. Security
- The new function is restricted: EXECUTE is revoked from PUBLIC, anon and authenticated. It only runs as a trigger.
- No existing policies are changed. Existing orders are not modified.

4. Notes
- Orders placed before this migration have no shift and are not included in any shift report.
- The `order_type` column already accepts any text value, so the new 'comedor' type needs no schema change.
*/

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.cash_register_shifts(id);

CREATE INDEX IF NOT EXISTS orders_shift_idx ON public.orders (shift_id);

CREATE OR REPLACE FUNCTION public.link_order_to_open_shift()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  open_shift_id uuid;
BEGIN
  SELECT id INTO open_shift_id
  FROM public.cash_register_shifts
  WHERE status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1;

  NEW.shift_id := open_shift_id;

  IF open_shift_id IS NOT NULL AND NEW.payment_method = 'efectivo' THEN
    UPDATE public.cash_register_shifts
    SET cash_sales = cash_sales + NEW.total
    WHERE id = open_shift_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.link_order_to_open_shift() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS link_order_to_open_shift ON public.orders;
CREATE TRIGGER link_order_to_open_shift
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.link_order_to_open_shift();
