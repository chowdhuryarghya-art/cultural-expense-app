BEGIN;

ALTER TABLE cultural.meal_order_items
  ADD COLUMN IF NOT EXISTS parcel_count INTEGER NOT NULL DEFAULT 0
  CHECK (
    parcel_count BETWEEN 0 AND 10000
    AND (meal <> 'Breakfast' OR parcel_count = 0)
  );

COMMIT;
