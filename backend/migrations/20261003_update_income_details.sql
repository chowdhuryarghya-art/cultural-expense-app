BEGIN;

DO $$
DECLARE
  has_received_by BOOLEAN;
  has_received_from BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'cultural'
      AND table_name = 'income'
      AND column_name = 'received_by'
  ) INTO has_received_by;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'cultural'
      AND table_name = 'income'
      AND column_name = 'received_from'
  ) INTO has_received_from;

  IF has_received_by AND NOT has_received_from THEN
    ALTER TABLE cultural.income
      RENAME COLUMN received_by TO received_from;
  ELSIF has_received_by AND has_received_from THEN
    UPDATE cultural.income
    SET received_from = COALESCE(NULLIF(received_from, ''), received_by);
  ELSIF NOT has_received_from THEN
    RAISE EXCEPTION
      'Expected cultural.income.received_by or cultural.income.received_from';
  END IF;
END
$$;

ALTER TABLE cultural.income
  ADD COLUMN IF NOT EXISTS block VARCHAR(100),
  ADD COLUMN IF NOT EXISTS flat_no VARCHAR(100);

COMMIT;
