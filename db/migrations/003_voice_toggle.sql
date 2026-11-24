-- Per-bot opt-in for voice calls (on top of the Growth/Agency plan gate in VOICE_ENABLED_PLANS).
-- Chat is always on; voice defaults off until the bot owner enables it for that bot.
SET NAMES utf8mb4;

ALTER TABLE bots ADD COLUMN voice_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER lead_capture;
