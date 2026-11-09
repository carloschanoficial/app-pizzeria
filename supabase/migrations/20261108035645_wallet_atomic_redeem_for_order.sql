/*
# Atomic wallet redemption and credit for orders

1. What changes
- Adds the function `redeem_wallet_for_order`, which the app calls when a customer confirms an order.
- It reads the customer's real balance, applies the redemption (capped by balance, redeem threshold and the requested amount), adds the cashback earned by the order, and saves the new balance, all in one step.

2. Tables and data
- No tables are created or altered.
- Reads `store_settings` (key `wallet_redeem_threshold`) and writes `virtual_wallets`.

3. Security
- The function runs with the owner's rights so anonymous customers can use it without direct write access to balances.
- Execute permission is removed from PUBLIC and granted only to `anon` and `authenticated`, the roles the app uses.

4. Important notes
- The redemption amount is never trusted blindly: it cannot exceed the balance, the threshold, or the requested amount.
- Row locking (FOR UPDATE) prevents two simultaneous orders from spending the same balance.
- The function returns the amount actually redeemed so the app can verify it matches the discount shown to the customer.
*/

CREATE OR REPLACE FUNCTION public.redeem_wallet_for_order(
  p_phone text,
  p_requested numeric,
  p_cashback numeric
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
  IF coalesce(p_requested, 0) < 0 OR coalesce(p_cashback, 0) < 0 THEN
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
    SET balance = greatest(v_balance - v_applied + coalesce(p_cashback, 0), 0),
        last_credited_at = now()
    WHERE customer_phone = v_phone;

  RETURN v_applied;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_wallet_for_order(text, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_wallet_for_order(text, numeric, numeric) TO anon, authenticated;
