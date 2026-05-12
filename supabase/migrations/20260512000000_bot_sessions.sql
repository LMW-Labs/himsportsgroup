-- Telegram bot conversation state
-- Service role key bypasses RLS; no row-level policies needed here
CREATE TABLE IF NOT EXISTS bot_sessions (
  chat_id            BIGINT       PRIMARY KEY,
  step               TEXT         NOT NULL DEFAULT 'idle',
  player_data        JSONB,
  image_candidates   JSONB,
  selected_image_url TEXT,
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;

-- Public storage bucket for athlete photos uploaded via Telegram
INSERT INTO storage.buckets (id, name, public)
VALUES ('athlete-photos', 'athlete-photos', true)
ON CONFLICT (id) DO NOTHING;
