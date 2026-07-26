-- Add a per-agreement commission percentage to nil_agreements, set from a new
-- question in the Telegram bot's "execute contract" flow. Previously the
-- commission was a hardcoded 20% baked into the agreement text.
--
-- DEPLOY SAFETY: pure superset — ADDS a column (with a default matching the
-- previous hardcoded rate) and WIDENS the bot_sessions field-key constraints.
-- Existing rows get commission_pct = 20, preserving current behavior.

ALTER TABLE nil_agreements ADD COLUMN IF NOT EXISTS commission_pct NUMERIC(5,2) NOT NULL DEFAULT 20;
ALTER TABLE nil_agreements DROP CONSTRAINT IF EXISTS nil_agreements_commission_pct_check;
ALTER TABLE nil_agreements ADD CONSTRAINT nil_agreements_commission_pct_check
  CHECK (commission_pct > 0 AND commission_pct <= 100);

-- ── Widen the field-key constraints to include the new contract question ────
-- roster : photo, name, school, school_type, position, height, social
-- contract: athlete_name, effective_date, term_years, commission_pct
-- news    : title, excerpt, body, article_image, author
ALTER TABLE bot_sessions DROP CONSTRAINT IF EXISTS bot_sessions_awaiting_check;
ALTER TABLE bot_sessions ADD CONSTRAINT bot_sessions_awaiting_check
  CHECK (awaiting IS NULL OR awaiting IN (
    'photo','name','school','school_type','position','height','social',
    'athlete_name','effective_date','term_years','commission_pct',
    'title','excerpt','body','article_image','author'));

ALTER TABLE bot_sessions DROP CONSTRAINT IF EXISTS bot_sessions_pending_omit_check;
ALTER TABLE bot_sessions ADD CONSTRAINT bot_sessions_pending_omit_check
  CHECK (pending_omit IS NULL OR pending_omit IN (
    'photo','name','school','school_type','position','height','social',
    'athlete_name','effective_date','term_years','commission_pct',
    'title','excerpt','body','article_image','author'));

ALTER TABLE bot_sessions DROP CONSTRAINT IF EXISTS bot_sessions_omitted_check;
ALTER TABLE bot_sessions ADD CONSTRAINT bot_sessions_omitted_check
  CHECK (omitted IS NULL OR omitted <@ '[
    "photo","name","school","school_type","position","height","social",
    "athlete_name","effective_date","term_years","commission_pct",
    "title","excerpt","body","article_image","author"]'::jsonb);
