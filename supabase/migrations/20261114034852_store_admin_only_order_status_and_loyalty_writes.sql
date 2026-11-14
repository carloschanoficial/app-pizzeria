/*
# Only store administrators can change order status or grant loyalty stamps

Plain-English summary
Customers can still place orders and read their own loyalty card, but they can no longer change an order's status or edit loyalty cards directly. Only the store administrator can mark orders as delivered (which grants stamps and cashback automatically) or manage loyalty cards.

1. Orders
- Removed the open update permission that allowed any visitor to change orders.
- Added an update policy that allows changes only when `is_store_admin()` is true.

2. Loyalty cards
- Removed the open insert, update and delete permissions for anonymous visitors.
- Added insert, update and delete policies that allow changes only when `is_store_admin()` is true.
- Customers keep read access to loyalty cards.

3. Notes
- Stamps and cashback are still granted by the delivery trigger, which runs with the owner's rights, so the automatic credit keeps working for every delivered order.
- Customer-side expiry resets on loyalty cards are no longer saved; the delivery trigger already treats expired stamps as zero.
- No data is deleted or changed.
*/

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
DROP POLICY IF EXISTS "store_admin_update_orders" ON orders;
CREATE POLICY "store_admin_update_orders" ON orders FOR UPDATE
  TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

REVOKE UPDATE ON orders FROM anon;
GRANT UPDATE ON orders TO authenticated;

DROP POLICY IF EXISTS "anon_insert_loyalty" ON loyalty_cards;
DROP POLICY IF EXISTS "anon_update_loyalty" ON loyalty_cards;
DROP POLICY IF EXISTS "anon_delete_loyalty" ON loyalty_cards;
DROP POLICY IF EXISTS "store_admin_insert_loyalty" ON loyalty_cards;
DROP POLICY IF EXISTS "store_admin_update_loyalty" ON loyalty_cards;
DROP POLICY IF EXISTS "store_admin_delete_loyalty" ON loyalty_cards;

CREATE POLICY "store_admin_insert_loyalty" ON loyalty_cards FOR INSERT
  TO authenticated
  WITH CHECK (public.is_store_admin());

CREATE POLICY "store_admin_update_loyalty" ON loyalty_cards FOR UPDATE
  TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

CREATE POLICY "store_admin_delete_loyalty" ON loyalty_cards FOR DELETE
  TO authenticated
  USING (public.is_store_admin());

REVOKE INSERT, UPDATE, DELETE ON loyalty_cards FROM anon;
GRANT INSERT, UPDATE, DELETE ON loyalty_cards TO authenticated;
