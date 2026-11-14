/*
# Per-shift weekly schedule

1. Modified table
- `service_shifts`: new nullable column `auto_schedule` (text). Stores the same weekly JSON format used by the store schedule (days 0-6 with open, openTime, closeTime).

2. Behavior
- NULL means the shift follows the store-wide schedule, so existing shifts keep their current behavior.

3. Security
- No new grants or policies. The existing table grants and super administrator update policy cover the new column.

4. Notes
- Non-destructive: only adds a nullable column.
*/

ALTER TABLE service_shifts ADD COLUMN IF NOT EXISTS auto_schedule text;
