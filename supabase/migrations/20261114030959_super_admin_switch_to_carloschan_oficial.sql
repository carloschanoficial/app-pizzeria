/*
# Switch the super administrator account to carloschan.oficial@gmail.com

Plain-English summary
The super administrator is the account with full control of the store: subscriptions, plans, plan requests, coupons and the cash register. Until now that account was carloschan1890@gmail.com. This migration makes carloschan.oficial@gmail.com the only super administrator and removes the old address from the privileged check.

1. Modified functions
- `public.is_super_admin()`: now returns true only when the signed-in email is carloschan.oficial@gmail.com. Every policy that already relies on this function (subscriptions, plans, plan requests, coupons, and the other super-admin-only areas) follows the new account automatically, with no policy rewrites.
- `public.is_store_admin()` is unchanged; it already calls `is_super_admin()` internally.

2. Administrators table
- The `administradores` table is not modified. The new address already has an active row there, and super administrators are never blocked by the expiry date, so no row changes are needed.

3. Security notes
- Function definition is replaced in place, so existing EXECUTE grants and the non-SECURITY-DEFINER setting are kept.
- No data is deleted or altered.
- The old address no longer has super administrator rights in the database after this migration runs.
*/

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'carloschan.oficial@gmail.com'
$$;
