/*
# Loyalty stamps default of 50 and live store settings

Plain-English summary
The default number of loyalty stamps becomes 50. The store setting loyalty_stamps_required is set to 50 (it stays editable from the admin settings). The order reward function falls back to 50 if the setting is missing or invalid. The store_settings table is added to the realtime feed so customer screens receive changes without reloading.

1. Data
- Updates the existing store setting loyalty_stamps_required to 50.

2. Reward function
- Replaces the stamp fallback from 6 to 50. Behavior is otherwise unchanged.

3. Realtime
- Adds store_settings to the supabase_realtime publication if it is not already there. Row level security still applies, so only rows readable by anon are delivered.

4. Security
- No policies, grants, or tables are dropped or changed.
*/

UPDATE store_settings
  SET value = '50'
  WHERE key = 'loyalty_stamps_required';

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
  v_required integer := 50;
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
  v_required := coalesce(v_required, 50);

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'store_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
  END IF;
END $$;
