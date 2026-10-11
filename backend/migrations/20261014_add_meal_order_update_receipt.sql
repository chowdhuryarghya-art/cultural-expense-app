BEGIN;

ALTER TABLE cultural.meal_orders
  ADD COLUMN IF NOT EXISTS last_added_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_additional_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_change_is_update BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE cultural.meal_orders orders
SET last_added_items = COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'meal_date', items.meal_date::text,
            'day_label', items.day_label,
            'meal', items.meal,
            'meal_type', items.meal_type,
            'option_code', items.option_code,
            'description', items.description,
            'price', items.price,
            'head_count', items.head_count,
            'line_total', items.price * items.head_count
          )
          ORDER BY items.meal_date,
            CASE items.meal
              WHEN 'Breakfast' THEN 1
              WHEN 'Lunch' THEN 2
              ELSE 3
            END,
            items.meal_type,
            items.option_code
        )
        FROM cultural.meal_order_items items
        WHERE items.order_id = orders.id
      ),
      '[]'::jsonb
    ),
    last_additional_amount = orders.total_amount;

COMMIT;
