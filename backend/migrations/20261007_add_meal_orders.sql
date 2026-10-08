BEGIN;

CREATE TABLE IF NOT EXISTS cultural.meal_menu_options (
  id BIGSERIAL PRIMARY KEY,
  meal_date DATE NOT NULL,
  day_label VARCHAR(40) NOT NULL,
  meal VARCHAR(20) NOT NULL CHECK (meal IN ('Breakfast', 'Lunch', 'Dinner')),
  option_code VARCHAR(40) NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('Veg', 'Non-Veg')),
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  display_order SMALLINT NOT NULL,
  UNIQUE (meal_date, meal, option_code)
);

CREATE TABLE IF NOT EXISTS cultural.meal_orders (
  id BIGSERIAL PRIMARY KEY,
  created_by BIGINT NOT NULL
    REFERENCES cultural.app_users(id) ON DELETE CASCADE,
  block VARCHAR(100) NOT NULL,
  flat_no VARCHAR(100) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cultural.meal_order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL
    REFERENCES cultural.meal_orders(id) ON DELETE CASCADE,
  menu_option_id BIGINT NOT NULL
    REFERENCES cultural.meal_menu_options(id) ON DELETE RESTRICT,
  meal_date DATE NOT NULL,
  day_label VARCHAR(40) NOT NULL,
  meal VARCHAR(20) NOT NULL CHECK (meal IN ('Breakfast', 'Lunch', 'Dinner')),
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('Veg', 'Non-Veg')),
  option_code VARCHAR(40) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  UNIQUE (order_id, meal_date, meal)
);

CREATE INDEX IF NOT EXISTS meal_orders_created_by_idx
  ON cultural.meal_orders(created_by);

CREATE INDEX IF NOT EXISTS meal_order_items_order_id_idx
  ON cultural.meal_order_items(order_id);

INSERT INTO cultural.meal_menu_options
  (meal_date, day_label, meal, option_code, meal_type, description, price, display_order)
VALUES
  ('2026-10-17', 'Saptami-1 (Saturday)', 'Breakfast', 'veg', 'Veg',
   'Hinger Kochuri + Cholar Dal + Misti', 50, 1),
  ('2026-10-17', 'Saptami-1 (Saturday)', 'Lunch', 'veg', 'Veg',
   'Rice + Sukto + Veg Dal + Kumroli + Potoler Dolma + Chutney + Papad', 150, 1),
  ('2026-10-17', 'Saptami-1 (Saturday)', 'Lunch', 'non-veg', 'Non-Veg',
   'Rice + Sukto + Veg Dal + Kumroli + Rui Kalia + Chutney + Papad', 180, 2),
  ('2026-10-17', 'Saptami-1 (Saturday)', 'Dinner', 'veg', 'Veg',
   'Lachha Paratha + Paneer Veg Navaratna + Salad + Mishti', 160, 1),
  ('2026-10-17', 'Saptami-1 (Saturday)', 'Dinner', 'non-veg', 'Non-Veg',
   'Lachha Paratha + Kadai Chicken + Salad + Mishti', 170, 2),

  ('2026-10-18', 'Saptami-2 (Sunday)', 'Breakfast', 'veg', 'Veg',
   'Kachuri + Aloo Dum + Jalebi', 50, 1),
  ('2026-10-18', 'Saptami-2 (Sunday)', 'Lunch', 'veg', 'Veg',
   'Rice + Moong Dal + Fool kophi er Roast + Jhuri Aloo Bhaja + Paneer Kofta Curry + Chutney + Papad', 175, 1),
  ('2026-10-18', 'Saptami-2 (Sunday)', 'Lunch', 'non-veg', 'Non-Veg',
   'Rice + Moong Dal + Fool kophi er Roast + Jhuri Aloo Bhaja + Doi Katla + Chutney + Papad', 190, 2),
  ('2026-10-18', 'Saptami-2 (Sunday)', 'Dinner', 'veg', 'Veg',
   'Polao + Sahi Paneer + Salad', 160, 1),
  ('2026-10-18', 'Saptami-2 (Sunday)', 'Dinner', 'non-veg', 'Non-Veg',
   'Polao + Chicken Rezala + Salad', 170, 2),

  ('2026-10-19', 'Astami (Monday)', 'Breakfast', 'veg', 'Veg',
   'Luchi + Sada Aloo Tarkari + Mishti', 50, 1),
  ('2026-10-19', 'Astami (Monday)', 'Lunch', 'complimentary', 'Veg',
   'Khichuri + Beguni + Labra + Chutney + Papad + Payesh (Complimentary)', 0, 1),
  ('2026-10-19', 'Astami (Monday)', 'Lunch', 'paid', 'Veg',
   'Khichuri + Beguni + Labra + Chutney + Papad + Payesh (Paid)', 125, 2),
  ('2026-10-19', 'Astami (Monday)', 'Dinner', 'veg', 'Veg',
   'Koraisutir Kochuri + Stuffed Potato + Cholar Dal', 150, 1),

  ('2026-10-20', 'Nabami (Tuesday)', 'Breakfast', 'veg', 'Veg',
   'Bread/Moori + Ghugni + Bonde', 50, 1),
  ('2026-10-20', 'Nabami (Tuesday)', 'Lunch', 'veg', 'Veg',
   'Rice + Moong Dal + Jhuri Aloo Bhaja + Chana er Curry + Dhokar Dalna + Chutney + Papad', 210, 1),
  ('2026-10-20', 'Nabami (Tuesday)', 'Lunch', 'mutton', 'Non-Veg',
   'Rice + Moong Dal + Jhuri Aloo Bhaja + Mutton Kosha + Chutney + Papad', 340, 2),
  ('2026-10-20', 'Nabami (Tuesday)', 'Lunch', 'chicken', 'Non-Veg',
   'Rice + Moong Dal + Jhuri Aloo Bhaja + Chicken Kosha + Chutney + Papad', 210, 3),
  ('2026-10-20', 'Nabami (Tuesday)', 'Dinner', 'veg', 'Veg',
   'Veg Chop + Veg Fried Rice + Chili Manchurian', 175, 1),
  ('2026-10-20', 'Nabami (Tuesday)', 'Dinner', 'non-veg', 'Non-Veg',
   'Veg Chop + Veg Fried Rice + Chilli Chicken', 190, 2),

  ('2026-10-21', 'Dashami (Wednesday)', 'Breakfast', 'veg', 'Veg',
   'Dalpuri + Cholar Dal + Misti', 50, 1),
  ('2026-10-21', 'Dashami (Wednesday)', 'Lunch', 'veg', 'Veg',
   'Rice + Biuli er Daal + Aloo Posto + Veg Kofta Curry + Chutney + Papad', 185, 1),
  ('2026-10-21', 'Dashami (Wednesday)', 'Lunch', 'non-veg', 'Non-Veg',
   'Rice + Biuli er Daal + Aloo Posto + Sorshe Pabda + Chutney + Papad', 205, 2),
  ('2026-10-21', 'Dashami (Wednesday)', 'Dinner', 'veg', 'Veg',
   'Basanti Polao + Paneer Butter Masala', 180, 1),
  ('2026-10-21', 'Dashami (Wednesday)', 'Dinner', 'non-veg', 'Non-Veg',
   'Basanti Polao + Chicken Dak Bunglow', 200, 2)
ON CONFLICT (meal_date, meal, option_code) DO UPDATE
SET day_label = EXCLUDED.day_label,
    meal_type = EXCLUDED.meal_type,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    display_order = EXCLUDED.display_order;

COMMIT;
