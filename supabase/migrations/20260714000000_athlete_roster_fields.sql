-- Roster rework: fields the Telegram bot collects + validates before publish.
-- Height stored as integer INCHES (canonical) — bot parses human input,
-- frontend formats back to 6'2". Social handles reuse existing instagram/
-- twitter/tiktok columns, so only these two new fields are added.

ALTER TABLE athletes ADD COLUMN IF NOT EXISTS height_inches INTEGER;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS school_type   TEXT;

ALTER TABLE athletes DROP CONSTRAINT IF EXISTS athletes_height_inches_check;
ALTER TABLE athletes ADD CONSTRAINT athletes_height_inches_check
  CHECK (height_inches IS NULL OR (height_inches BETWEEN 48 AND 96));

ALTER TABLE athletes DROP CONSTRAINT IF EXISTS athletes_school_type_check;
ALTER TABLE athletes ADD CONSTRAINT athletes_school_type_check
  CHECK (school_type IS NULL OR school_type IN ('prep', 'juco', 'international'));
