ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'available'
  CHECK (availability IN ('available', 'signed'));
