-- Per-bot "Live / Paused" switch, separate from `status` (which tracks training
-- lifecycle) and `voice_enabled` (which gates voice specifically). When paused,
-- the widget stops answering chat and voice for that bot.
SET NAMES utf8mb4;

ALTER TABLE bots ADD COLUMN is_live TINYINT(1) NOT NULL DEFAULT 1 AFTER status;
