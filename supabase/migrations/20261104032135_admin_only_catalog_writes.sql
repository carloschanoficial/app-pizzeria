/*
# Restrict catalog and storage writes to the store administrator

1. New function
- `public.is_store_admin()` returns true only when the signed-in session's email is the administrator account.

2. Security changes
- products, categories, extra_ingredients, promo_banners, store_settings: anonymous visitors keep read access only. Insert, update and delete now require an authenticated session whose email is the administrator account.
- storage.objects for the product-images bucket: anonymous visitors keep read access only. Upload, update and delete require the administrator session.
- Orders, loyalty cards and virtual wallets are intentionally unchanged because customers write them during checkout.

3. Notes
- Table structure and data are not modified.
- Email confirmation is off, so the administrator account must be created by signing up with that exact email before anyone else does.
*/

CREATE OR REPLACE FUNCTION public.is_store_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') = 'carloschan1890@gmail.com'
$$;

REVOKE EXECUTE ON FUNCTION public.is_store_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_store_admin() TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON products, categories, extra_ingredients, promo_banners, store_settings FROM anon;
GRANT INSERT, UPDATE, DELETE ON products, categories, extra_ingredients, promo_banners, store_settings TO authenticated;

DROP POLICY IF EXISTS "anon_insert_products" ON products;
DROP POLICY IF EXISTS "anon_update_products" ON products;
DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT TO authenticated WITH CHECK (public.is_store_admin());
CREATE POLICY "admin_update_products" ON products FOR UPDATE TO authenticated USING (public.is_store_admin()) WITH CHECK (public.is_store_admin());
CREATE POLICY "admin_delete_products" ON products FOR DELETE TO authenticated USING (public.is_store_admin());

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT TO authenticated WITH CHECK (public.is_store_admin());
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE TO authenticated USING (public.is_store_admin()) WITH CHECK (public.is_store_admin());
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE TO authenticated USING (public.is_store_admin());

DROP POLICY IF EXISTS "anon_insert_extras" ON extra_ingredients;
DROP POLICY IF EXISTS "anon_update_extras" ON extra_ingredients;
DROP POLICY IF EXISTS "anon_delete_extras" ON extra_ingredients;
CREATE POLICY "admin_insert_extras" ON extra_ingredients FOR INSERT TO authenticated WITH CHECK (public.is_store_admin());
CREATE POLICY "admin_update_extras" ON extra_ingredients FOR UPDATE TO authenticated USING (public.is_store_admin()) WITH CHECK (public.is_store_admin());
CREATE POLICY "admin_delete_extras" ON extra_ingredients FOR DELETE TO authenticated USING (public.is_store_admin());

DROP POLICY IF EXISTS "anon_insert_banners" ON promo_banners;
DROP POLICY IF EXISTS "anon_update_banners" ON promo_banners;
DROP POLICY IF EXISTS "anon_delete_banners" ON promo_banners;
CREATE POLICY "admin_insert_banners" ON promo_banners FOR INSERT TO authenticated WITH CHECK (public.is_store_admin());
CREATE POLICY "admin_update_banners" ON promo_banners FOR UPDATE TO authenticated USING (public.is_store_admin()) WITH CHECK (public.is_store_admin());
CREATE POLICY "admin_delete_banners" ON promo_banners FOR DELETE TO authenticated USING (public.is_store_admin());

DROP POLICY IF EXISTS "anon_insert_settings" ON store_settings;
DROP POLICY IF EXISTS "anon_update_settings" ON store_settings;
DROP POLICY IF EXISTS "anon_delete_settings" ON store_settings;
CREATE POLICY "admin_insert_settings" ON store_settings FOR INSERT TO authenticated WITH CHECK (public.is_store_admin());
CREATE POLICY "admin_update_settings" ON store_settings FOR UPDATE TO authenticated USING (public.is_store_admin()) WITH CHECK (public.is_store_admin());
CREATE POLICY "admin_delete_settings" ON store_settings FOR DELETE TO authenticated USING (public.is_store_admin());

DROP POLICY IF EXISTS "anon_upload_products" ON storage.objects;
DROP POLICY IF EXISTS "anon_update_products" ON storage.objects;
DROP POLICY IF EXISTS "anon_delete_products" ON storage.objects;
CREATE POLICY "admin_upload_product_images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_store_admin());
CREATE POLICY "admin_update_product_images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_store_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_store_admin());
CREATE POLICY "admin_delete_product_images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_store_admin());
