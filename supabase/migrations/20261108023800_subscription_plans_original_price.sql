/*
# Original price for subscription plans

1. Modified table
- `planes_suscripcion`: new optional column `precio_original` (numeric, nullable).
  When set and higher than `precio`, the plan card shows the original price crossed out next to the current price.

2. Security
- No changes to policies or grants. The existing super administrator rules already cover this column.

3. Notes
- Existing plans keep null in this column and display exactly as before.
*/

ALTER TABLE planes_suscripcion ADD COLUMN IF NOT EXISTS precio_original numeric;
