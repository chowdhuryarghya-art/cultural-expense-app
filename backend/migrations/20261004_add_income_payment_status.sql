BEGIN;

ALTER TABLE cultural.income
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'income_payment_status_check'
      AND conrelid = 'cultural.income'::regclass
  ) THEN
    ALTER TABLE cultural.income
      ADD CONSTRAINT income_payment_status_check
      CHECK (payment_status IS NULL OR payment_status IN ('Paid', 'Pending'));
  END IF;
END
$$;

COMMIT;
