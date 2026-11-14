/*
# Credit loyalty stamps and wallet cashback only when an order is delivered

Plain-English summary
Loyalty stamps, the loyalty reward reset, and Olla de Dinero cashback used to be applied as soon as a customer pressed "Enviar Pedido". Orders that failed, were cancelled, or never completed still earned rewards. From now on these are applied once, automatically, when an order's status becomes "entregado".

1. New columns on orders
- `wallet_cashback` (numeric, default 0): the cashback the order will credit to the Olla de Dinero when delivered.
- `rewards_applied` (boolean, default false): true once the stamp, reward reset and cashback for this order have been applied. Prevents double crediting.
- Existing orders are marked `rewards_applied = true` because their rewards were already granted at checkout.

2. New trigger function and trigger
- `apply_order_rewards()` runs BEFORE an order's status is updated. When the status changes to "entregado" and rewards have not been applied yet, it:
  - If the order contains the loyalty free reward: resets the customer's loyalty card (stamps to 0, reward not claimed).
  - Otherwise: adds one stamp to the customer's card, respecting the 30-day expiry and the 6-stamp cap.
  - If `wallet_cashback` is above 0: adds it to the customer's Olla de Dinero balance.
  - Sets `rewards_applied = true`.
- Cancelled, pending, or otherwise non-delivered orders never trigger any credit.

3. Changed function
- `redeem_wallet_for_order` now only applies the redemption at checkout. It no longer adds cashback, since cashback is credited on delivery. Its signature changes from three to two arguments.

4. Security
- The trigger function runs with the owner's rights and is not callable directly by any role.
- Execute permission on `redeem_wallet_for_order` stays limited to `anon` and `authenticated`.
- No tables are dropped and no data is deleted.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS wallet_cashback numeric NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rewards_applied boolean NOT NULL DEFAULT false;

UPDATE orders SET rewards_applied = true WHERE rewards_applied = false;

CREATE OR REPLACE FUNCTION public.apply_order_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text := btrim(coalesce(NEW.customer_phone, ''));
  v_free boolean;
  v_now timestamptz := now();
  v_card loyalty_cards%ROWTYPE;
  v_expired boolean;
BEGIN
  IF NEW.status IS DISTINCT FROM 'entregado' OR OLD.status = 'entregado' OR NEW.rewards_applied THEN
    RETURN NEW;
  END IF;

  IF v_phone <> '' THEN
    SELECT EXISTS (
      SELECT 1 FROM jsonb_array_elements(coalesce(NEW.items, '[]'::jsonb)) AS e
      WHERE (e->>'is_free_reward')::boolean IS TRUE
    ) INTO v_free;

    IF v_free THEN
      UPDATE loyalty_cards
        SET stamps = 0, reward_claimed = false, last_order_at = v_now
        WHERE customer_phone = v_phone;
    ELSE
      SELECT * INTO v_card FROM loyalty_cards WHERE customer_phone = v_phone FOR UPDATE;
      IF FOUND THEN
        v_expired := v_card.stamps > 0
          AND (v_card.last_stamp_at IS NULL OR v_now - v_card.last_stamp_at > interval '30 days');
        UPDATE loyalty_cards
          SET stamps = least((CASE WHEN v_expired THEN 0 ELSE v_card.stamps END) + 1, 6),
              last_stamp_at = v_now,
              last_order_at = v_now
          WHERE id = v_card.id;
      ELSE
        INSERT INTO loyalty_cards (customer_phone, stamps, last_stamp_at, last_order_at)
        VALUES (v_phone, 1, v_now, v_now);
      END IF;
    END IF;

    IF coalesce(NEW.wallet_cashback, 0) > 0 THEN
      IF NOT EXISTS (SELECT 1 FROM virtual_wallets WHERE customer_phone = v_phone) THEN
        INSERT INTO virtual_wallets (customer_phone, balance, last_credited_at)
        VALUES (v_phone, 0, v_now);
      END IF;
      UPDATE virtual_wallets
        SET balance = balance + NEW.wallet_cashback,
            last_credited_at = v_now
        WHERE customer_phone = v_phone;
    END IF;
  END IF;

  NEW.rewards_applied := true;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_order_rewards() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_apply_rewards_on_delivery ON orders;
CREATE TRIGGER orders_apply_rewards_on_delivery
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_order_rewards();

DROP FUNCTION IF EXISTS public.redeem_wallet_for_order(text, numeric, numeric);

CREATE OR REPLACE FUNCTION public.redeem_wallet_for_order(
  p_phone text,
  p_requested numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text := btrim(coalesce(p_phone, ''));
  v_threshold numeric := 0;
  v_balance numeric := 0;
  v_applied numeric := 0;
BEGIN
  IF v_phone = '' THEN
    RAISE EXCEPTION 'phone_required';
  END IF;
  IF coalesce(p_requested, 0) < 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT coalesce(nullif(btrim(value), '')::numeric, 0)
    INTO v_threshold
    FROM store_settings
    WHERE key = 'wallet_redeem_threshold';

  IF NOT EXISTS (SELECT 1 FROM virtual_wallets WHERE customer_phone = v_phone) THEN
    INSERT INTO virtual_wallets (customer_phone, balance, last_credited_at)
    VALUES (v_phone, 0, now());
  END IF;

  SELECT balance INTO v_balance
    FROM virtual_wallets
    WHERE customer_phone = v_phone
    FOR UPDATE;

  IF coalesce(v_threshold, 0) > 0 AND v_balance >= v_threshold THEN
    v_applied := least(v_balance, v_threshold, coalesce(p_requested, 0));
  END IF;

  UPDATE virtual_wallets
    SET balance = greatest(v_balance - v_applied, 0)
    WHERE customer_phone = v_phone;

  RETURN v_applied;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_wallet_for_order(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_wallet_for_order(text, numeric) TO anon, authenticated;
