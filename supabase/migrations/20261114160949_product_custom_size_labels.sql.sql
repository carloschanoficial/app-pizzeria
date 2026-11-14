/*
# Custom size and portion names per product

1. Modified Tables
- `products`: new nullable column `size_labels` (jsonb). Stores optional display names for each of the four price slots (chica, mediana, grande, familiar), e.g. {"chica": "Media Orden", "familiar": "Orden Completa"}.

2. Behavior
- NULL or missing keys fall back to the default names (Chica, Mediana, Grande, Familiar), so existing pizzas are unchanged.

3. Security
- No new grants or policies needed: the table already grants the existing privileges, and the column inherits them.

4. Notes
- Non-destructive: only adds a column. No existing data is modified.
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS size_labels jsonb;
