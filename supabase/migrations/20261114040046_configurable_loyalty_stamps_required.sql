/*
# Configurable number of loyalty stamps

Plain-English summary
The number of stamps needed to earn the loyalty reward was fixed at 6. It is now stored in the store settings (default 6), and the delivery credit uses that value, so each store can choose its own target such as 7, 8 or 50.

1. Adds the setting `loyalty_stamps_required` with the value 6 when it does not exist yet. Existing values are not changed.
2. Replaces the delivery credit function so the stamp cap comes from that setting. If the setting is missing or invalid, it falls back to 6.

Security
- No table or policy changes. Store settings are already writable only by store administrators (including the super admin), so this setting follows the same rules.
*/

INSERT INTO store_settings (key, value)
VALUES ('loyalty_stamps_required', '6')
ON CONFLICT (key) DO NOTHING;

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
BEGIN
  IF NEW.status IS DISTINCT FROM 'entregado' OR OLD.status = 'entregado' OR NEW.rewards_applied THEN
    RETURN NEW;
  END IF;

  SELECT CASE WHEN value ~ '^[0-9]+$' AND value::integer >= 1 THEN value::integer END
    INTO v_required
    FROM store_settings
    WHERE key = 'loyalty_stamps_required';
  v_required := coalesce(v_required, 6);

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
          SET stamps = least((CASE WHEN v_expired THEN 0 ELSE v_card.stamps END) + 1, v_required),
              last_stamp_at = v_now,
              last_order_at = v_now
          WHERE id = v_card.id;
      ELSE
        INSERT INTO loyalty_cards (customer_phone, stamps, last_stamp_at, last_order_at)
        VALUES (v_phone, least(1, v_required), v_now, v_now);
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
