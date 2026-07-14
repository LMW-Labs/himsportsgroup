-- Bot session state for the rewritten roster flow (run BEFORE deploying the
-- new api/telegram.js).
--
-- The new state machine tracks which field it's awaiting, which fields the
-- owner intentionally omitted, and a pending omission awaiting confirmation.
-- awaiting/pending_omit only ever hold a known field key, so a CHECK guards
-- against typos (same pattern as athletes.school_type).
--
-- The old image-search columns (image_candidates, selected_image_url) are no
-- longer referenced by the new code but are intentionally NOT dropped here —
-- the currently-deployed bot still writes them, so dropping them pre-deploy
-- would break the live bot. They are removed in a follow-up migration
-- (20260714000200) to be run AFTER this PR deploys.

ALTER TABLE bot_sessions ADD COLUMN IF NOT EXISTS awaiting     TEXT;
ALTER TABLE bot_sessions ADD COLUMN IF NOT EXISTS omitted      JSONB DEFAULT '[]'::jsonb;
ALTER TABLE bot_sessions ADD COLUMN IF NOT EXISTS pending_omit TEXT;

-- Constrain the two field-key columns to the known set.
ALTER TABLE bot_sessions DROP CONSTRAINT IF EXISTS bot_sessions_awaiting_check;
ALTER TABLE bot_sessions ADD CONSTRAINT bot_sessions_awaiting_check
  CHECK (awaiting IS NULL OR awaiting IN
    ('photo','name','school','school_type','position','height','social'));

ALTER TABLE bot_sessions DROP CONSTRAINT IF EXISTS bot_sessions_pending_omit_check;
ALTER TABLE bot_sessions ADD CONSTRAINT bot_sessions_pending_omit_check
  CHECK (pending_omit IS NULL OR pending_omit IN
    ('photo','name','school','school_type','position','height','social'));

-- omitted is a JSONB array; enforce every element comes from the same key set
-- (containment). Defense-in-depth: the bot is the sole writer, but this catches
-- a bad write from a future code typo.
ALTER TABLE bot_sessions DROP CONSTRAINT IF EXISTS bot_sessions_omitted_check;
ALTER TABLE bot_sessions ADD CONSTRAINT bot_sessions_omitted_check
  CHECK (omitted IS NULL OR omitted <@
    '["photo","name","school","school_type","position","height","social"]'::jsonb);
