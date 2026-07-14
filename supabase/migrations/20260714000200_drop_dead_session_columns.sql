-- Cleanup: drop the dead image-search session columns.
--
-- ⚠️ RUN THIS ONLY AFTER the rewritten api/telegram.js has deployed.
-- The old bot wrote image_candidates / selected_image_url on every upsert;
-- dropping them while that old code is still live would break the bot.
-- Once the new code (which references neither) is the deployed webhook, these
-- columns are safe to remove.

ALTER TABLE bot_sessions DROP COLUMN IF EXISTS image_candidates;
ALTER TABLE bot_sessions DROP COLUMN IF EXISTS selected_image_url;
