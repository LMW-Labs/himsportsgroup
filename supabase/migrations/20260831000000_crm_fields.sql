-- CRM fields for admin dashboard
-- Adds contact info to athletes and lead-tracking fields to inquiries.
-- Safe to run on a live database — all changes are pure additions.

-- ── Athletes: contact fields ──────────────────────────────────────────────────
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS phone TEXT;

-- ── Inquiries: CRM status ─────────────────────────────────────────────────────
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notes  TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;

ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check
  CHECK (status IN ('new', 'contacted', 'converted', 'archived'));
