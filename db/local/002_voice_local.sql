-- Voice chat (OpenAI Realtime API) — metered from the existing credit wallet.
SET NAMES utf8mb4;

ALTER TABLE credit_transactions
  MODIFY reason ENUM('bonus','purchase','chat','refund','adjust','voice') NOT NULL;

CREATE TABLE IF NOT EXISTS voice_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bot_id BIGINT UNSIGNED NOT NULL,
  workspace_id BIGINT UNSIGNED NOT NULL,
  conversation_id BIGINT UNSIGNED NULL,
  visitor_id CHAR(36) NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  seconds INT NOT NULL DEFAULT 0,
  credits_charged INT NOT NULL DEFAULT 0,
  KEY (bot_id, started_at),
  FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
);
