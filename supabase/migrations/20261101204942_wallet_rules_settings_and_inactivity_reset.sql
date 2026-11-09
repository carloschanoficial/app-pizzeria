/*
# Configurable Olla de Dinero rules and one-month inactivity reset

1. Store settings
- Adds `wallet_cashback_per_order` (amount added to the Olla de Dinero per purchase, default 0.5).
- Adds `wallet_redeem_threshold` (balance needed to redeem the Olla, default 20).
- Existing values are never overwritten.

2. Scheduled inactivity reset
- Enables the pg_cron extension.
- Schedules a daily job that resets loyalty stamps and Olla de Dinero balances for customers
  whose last stamp or last credited purchase is older than 30 days.
- Re-scheduling with the same job name replaces the previous job, so this migration is safe to re-run.

3. Security
- No tables or policies are changed.
- The scheduled job runs inside the database with its own privileges and does not depend on the client.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;

INSERT INTO store_settings (key, value)
SELECT 'wallet_cashback_per_order', '0.5'
WHERE NOT EXISTS (SELECT 1 FROM store_settings WHERE key = 'wallet_cashback_per_order');

INSERT INTO store_settings (key, value)
SELECT 'wallet_redeem_threshold', '20'
WHERE NOT EXISTS (SELECT 1 FROM store_settings WHERE key = 'wallet_redeem_threshold');

SELECT cron.schedule(
  'reset-inactive-customers',
  '0 6 * * *',
  $$
  UPDATE loyalty_cards
     SET stamps = 0, reward_claimed = false
   WHERE stamps > 0
     AND last_stamp_at < now() - interval '30 days';

  UPDATE virtual_wallets
     SET balance = 0
   WHERE balance > 0
     AND COALESCE(last_credited_at, created_at) < now() - interval '30 days';
  $$
);
