/*
# Storage policies for product-images bucket
*/
CREATE POLICY "anon_upload_products" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "anon_read_products" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "anon_update_products" ON storage.objects
FOR UPDATE TO anon, authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "anon_delete_products" ON storage.objects
FOR DELETE TO anon, authenticated
USING (bucket_id = 'product-images');
