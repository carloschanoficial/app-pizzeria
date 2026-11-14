/*
# Only store administrators can change Olla de Dinero balances

Plain-English summary
Visitors can still see their own wallet balance, but they can no longer change it directly. Balance changes now happen only through the checkout function (which applies redemptions and credits delivered orders) or through the store administrator.

1. Removed the open insert, update and delete permissions that let anonymous visitors edit any wallet balance.
2. Added insert and update policies for the store administrator, checked with is_store_admin().
3. Customers keep read access to their own wallet.

Notes
- The checkout redemption and the delivery credit run with the owner's rights, so they keep working.
- No data is deleted or changed.
*/

DROP POLICY IF EXISTS "anon_insert_wallets" ON virtual_wallets;
DROP POLICY IF EXISTS "anon_update_wallets" ON virtual_wallets;
DROP POLICY IF EXISTS "anon_delete_wallets" ON virtual_wallets;
DROP POLICY IF EXISTS "store_admin_insert_wallets" ON virtual_wallets;
DROP POLICY IF EXISTS "store_admin_update_wallets" ON virtual_wallets;

CREATE POLICY "store_admin_insert_wallets" ON virtual_wallets FOR INSERT
  TO authenticated
  WITH CHECK (public.is_store_admin());

CREATE POLICY "store_admin_update_wallets" ON virtual_wallets FOR UPDATE
  TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

REVOKE INSERT, UPDATE, DELETE ON virtual_wallets FROM anon;
GRANT INSERT, UPDATE ON virtual_wallets TO authenticated;
