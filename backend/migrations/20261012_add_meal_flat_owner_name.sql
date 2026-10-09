BEGIN;

ALTER TABLE cultural.meal_order_flats
  ADD COLUMN IF NOT EXISTS owner_name VARCHAR(150);

COMMIT;
