BEGIN;

ALTER TABLE cultural.meal_orders
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(16);

COMMIT;
