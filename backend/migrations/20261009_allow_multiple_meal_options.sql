BEGIN;

ALTER TABLE cultural.meal_order_items
  DROP CONSTRAINT IF EXISTS meal_order_items_order_id_meal_date_meal_key;

CREATE UNIQUE INDEX IF NOT EXISTS meal_order_items_order_option_idx
  ON cultural.meal_order_items(order_id, menu_option_id);

COMMIT;
