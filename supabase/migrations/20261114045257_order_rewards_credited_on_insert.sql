/*
# Credit loyalty stamps and Olla de Dinero when an order is placed

Plain-English summary
Stamps and Olla de Dinero cashback are now applied in the same database step that saves a new order, instead of waiting for the order to be marked "entregado" in the admin panel.

1. Trigger change
- The reward trigger on orders now runs BEFORE INSERT instead of BEFORE UPDATE of status.
- It applies the stamp (or the free-reward reset) and the cashback exactly once per order, then sets rewards_applied = true.
- The old delivery-time trigger is removed so rewards are never applied twice.

2. Server-side cashback amount
- The cashback is read from the store setting wallet_cashback_per_order at insert time.
- The value sent by the browser is ignored, so a customer cannot inflate their Olla de Dinero.
- Orders without a phone number get no stamp and no cashback.

3. Stamp limit
- The stamp cap still comes from the store setting loyalty_stamps_required (fallback 6).

4. Security
- The trigger function still runs with owner rights and is not callable by any role.
- No tables are dropped and no data is deleted.
*/

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
  v_required integer := 6;
  v_cashback numeric;
BEGIN
  IF NEW.rewards_applied THEN
    RETURN NEW;
  END IF;

  IF v_phone = '' THEN
    NEW.wallet_cashback := 0;
    NEW.rewards_applied := true;
    RETURN NEW;
  END IF;

  SELECT CASE WHEN value ~ '^[0-9]+$' AND value::integer >= 1 THEN value::integer END
    INTO v_required
    FROM store_settings
    WHERE key = 'loyalty_stamps_required';
  v_required := coalesce(v_required, 6);

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
        SET stamps = least((CASE WHEN v_expired THEN 0 ELSE v_card.stamps END) + 1, v_required),
            last_stamp_at = v_now,
            last_order_at = v_now
        WHERE id = v_card.id;
    ELSE
      INSERT INTO loyalty_cards (customer_phone, stamps, last_stamp_at, last_order_at)
      VALUES (v_phone, least(1, v_required), v_now, v_now);
    END IF;
  END IF;

  SELECT CASE WHEN value ~ '^[0-9]+(\.[0-9]+)?$' THEN value::numeric END
    INTO v_cashback
    FROM store_settings
    WHERE key = 'wallet_cashback_per_order';
  NEW.wallet_cashback := coalesce(v_cashback, 0);

  IF NEW.wallet_cashback > 0 THEN
    IF NOT EXISTS (SELECT 1 FROM virtual_wallets WHERE customer_phone = v_phone) THEN
      INSERT INTO virtual_wallets (customer_phone, balance, last_credited_at)
      VALUES (v_phone, 0, v_now);
    END IF;
    UPDATE virtual_wallets
      SET balance = balance + NEW.wallet_cashback,
          last_credited_at = v_now
      WHERE customer_phone = v_phone;
  END IF;

  NEW.rewards_applied := true;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_order_rewards() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_apply_rewards_on_delivery ON orders;
DROP TRIGGER IF EXISTS orders_apply_rewards_on_insert ON orders;
CREATE TRIGGER orders_apply_rewards_on_insert
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_order_rewards();
