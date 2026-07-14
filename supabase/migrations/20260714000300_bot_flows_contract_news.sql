-- Two new bot flows: contract execution + news article publishing.
-- Run BEFORE deploying the updated api/telegram.js.
--
-- DEPLOY SAFETY: this migration is a pure superset — it only ADDS a column
-- (with a default) and WIDENS existing CHECK constraints to accept the new
-- flows' field keys. The currently-live bot writes none of the new keys and
-- never sets `flow`, so running this ahead of the code deploy cannot break it
-- (old rows default flow='roster', which is their correct behavior).

-- ── Which flow a session is running ─────────────────────────────────────────
ALTER TABLE bot_sessions ADD COLUMN IF NOT EXISTS flow TEXT NOT NULL DEFAULT 'roster';

ALTER TABLE bot_sessions DROP CONSTRAINT IF EXISTS bot_sessions_flow_check;
ALTER TABLE bot_sessions ADD CONSTRAINT bot_sessions_flow_check
  CHECK (flow IN ('roster', 'contract', 'news'));

-- ── Widen the field-key constraints to the union of all three flows ─────────
-- roster : photo, name, school, school_type, position, height, social
-- contract: athlete_name, effective_date, term_years
-- news    : title, excerpt, body, article_image, author
ALTER TABLE bot_sessions DROP CONSTRAINT IF EXISTS bot_sessions_awaiting_check;
ALTER TABLE bot_sessions ADD CONSTRAINT bot_sessions_awaiting_check
  CHECK (awaiting IS NULL OR awaiting IN (
    'photo','name','school','school_type','position','height','social',
    'athlete_name','effective_date','term_years',
    'title','excerpt','body','article_image','author'));

ALTER TABLE bot_sessions DROP CONSTRAINT IF EXISTS bot_sessions_pending_omit_check;
ALTER TABLE bot_sessions ADD CONSTRAINT bot_sessions_pending_omit_check
  CHECK (pending_omit IS NULL OR pending_omit IN (
    'photo','name','school','school_type','position','height','social',
    'athlete_name','effective_date','term_years',
    'title','excerpt','body','article_image','author'));

ALTER TABLE bot_sessions DROP CONSTRAINT IF EXISTS bot_sessions_omitted_check;
ALTER TABLE bot_sessions ADD CONSTRAINT bot_sessions_omitted_check
  CHECK (omitted IS NULL OR omitted <@ '[
    "photo","name","school","school_type","position","height","social",
    "athlete_name","effective_date","term_years",
    "title","excerpt","body","article_image","author"]'::jsonb);

-- ── Public bucket for article featured images uploaded via Telegram ─────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;
