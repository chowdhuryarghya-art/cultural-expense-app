BEGIN;

CREATE TABLE IF NOT EXISTS cultural.meal_order_blocks (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cultural.meal_order_flats (
  id BIGSERIAL PRIMARY KEY,
  block_id BIGINT NOT NULL
    REFERENCES cultural.meal_order_blocks(id) ON DELETE CASCADE,
  flat_no VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (block_id, flat_no)
);

CREATE TABLE IF NOT EXISTS cultural.meal_order_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  subscription_event_id INTEGER
    REFERENCES cultural.events(id) ON DELETE SET NULL
);

INSERT INTO cultural.meal_order_settings (singleton)
VALUES (TRUE)
ON CONFLICT (singleton) DO NOTHING;

CREATE INDEX IF NOT EXISTS meal_order_flats_block_id_idx
  ON cultural.meal_order_flats(block_id);

COMMIT;
