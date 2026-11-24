-- Botfolks LOCAL-DEV schema for plain MySQL (no native vector type).
-- Embeddings are stored as JSON text; set VECTOR_MODE=js in .env.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120),
  email_verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(32) PRIMARY KEY,             -- free | starter | growth | agency
  name VARCHAR(64) NOT NULL,
  price_monthly_cents INT NOT NULL DEFAULT 0,
  price_yearly_cents INT NOT NULL DEFAULT 0,
  chats_per_month INT NOT NULL DEFAULT 0,  -- 0 = credits only
  max_bots INT NOT NULL DEFAULT 1,
  file_training TINYINT(1) NOT NULL DEFAULT 0,
  white_label TINYINT(1) NOT NULL DEFAULT 0
);

INSERT INTO plans VALUES
 ('free',    'Free',     0,     0,      0,     1,  0, 0),
 ('starter', 'Starter',  1900,  19900,  2000,  1,  1, 0),
 ('growth',  'Growth',   4900,  52900,  5500,  3,  1, 0),
 ('agency',  'Agency',   14900, 159900, 18000, 15, 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

CREATE TABLE IF NOT EXISTS workspaces (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  plan_id VARCHAR(32) NOT NULL DEFAULT 'free',
  brand_json JSON NULL,                   -- white-label: logo, colors, domain
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('owner','admin','member') NOT NULL DEFAULT 'member',
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id BIGINT UNSIGNED NOT NULL,
  plan_id VARCHAR(32) NOT NULL,
  billing_cycle ENUM('monthly','yearly') NOT NULL,
  provider ENUM('dodo','paypal') NOT NULL DEFAULT 'dodo',
  provider_sub_id VARCHAR(128),
  status ENUM('active','past_due','canceled') NOT NULL DEFAULT 'active',
  current_period_end DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_provider_sub (provider_sub_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bots (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id BIGINT UNSIGNED NOT NULL,
  public_key CHAR(24) NOT NULL UNIQUE,    -- used in embed script
  name VARCHAR(120) NOT NULL,
  system_prompt TEXT,
  welcome_message VARCHAR(500) DEFAULT 'Hi! How can I help you today?',
  languages JSON NULL,                    -- ["en","es","de"]
  theme_json JSON NULL,
  lead_capture TINYINT(1) NOT NULL DEFAULT 1,
  allowed_domains JSON NULL,
  model VARCHAR(80) NULL,
  status ENUM('draft','training','ready','error') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sources (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bot_id BIGINT UNSIGNED NOT NULL,
  type ENUM('url','sitemap','file','text') NOT NULL,
  ref VARCHAR(1000) NOT NULL,             -- URL or file path
  meta_json JSON NULL,                    -- {"name":"policy.pdf"}
  content_hash CHAR(64) NULL,
  status ENUM('pending','processing','done','error') NOT NULL DEFAULT 'pending',
  error TEXT NULL,
  last_synced_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (bot_id),
  FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chunks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bot_id BIGINT UNSIGNED NOT NULL,
  source_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  meta_json JSON,
  embedding LONGTEXT NOT NULL,
  KEY (bot_id), KEY (source_id)
);

CREATE TABLE IF NOT EXISTS qa_pairs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bot_id BIGINT UNSIGNED NOT NULL,
  question VARCHAR(1000) NOT NULL,
  answer TEXT NOT NULL,
  embedding LONGTEXT NOT NULL,
  KEY (bot_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bot_id BIGINT UNSIGNED NOT NULL,
  visitor_id CHAR(36) NOT NULL,
  page_url VARCHAR(1000),
  language VARCHAR(8),
  ai_answers INT NOT NULL DEFAULT 0,      -- 1 billable chat = up to 6 answers
  billed_chats INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (bot_id, created_at)
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT UNSIGNED NOT NULL,
  role ENUM('user','assistant','system') NOT NULL,
  content TEXT NOT NULL,
  tokens_in INT DEFAULT 0,
  tokens_out INT DEFAULT 0,
  cost_micro_usd INT DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (conversation_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bot_id BIGINT UNSIGNED NOT NULL,
  conversation_id BIGINT UNSIGNED NULL,
  name VARCHAR(120), email VARCHAR(255), phone VARCHAR(40),
  need TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (bot_id, created_at)
);

CREATE TABLE IF NOT EXISTS usage_monthly (
  workspace_id BIGINT UNSIGNED NOT NULL,
  period CHAR(7) NOT NULL,                -- 2026-11
  chats INT NOT NULL DEFAULT 0,
  overage_chats INT NOT NULL DEFAULT 0,
  cost_micro_usd BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, period)
);

CREATE TABLE IF NOT EXISTS credit_wallets (
  workspace_id BIGINT UNSIGNED PRIMARY KEY,
  balance INT NOT NULL DEFAULT 25,        -- 25 free bonus credits (1 credit = $0.01)
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id BIGINT UNSIGNED NOT NULL,
  delta INT NOT NULL,                     -- +purchase / -chat
  reason ENUM('bonus','purchase','chat','refund','adjust') NOT NULL,
  ref VARCHAR(128) NULL,                  -- payment id / conversation id
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (workspace_id, created_at)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id BIGINT UNSIGNED NOT NULL,
  key_hash CHAR(64) NOT NULL UNIQUE,
  label VARCHAR(80),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhooks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id BIGINT UNSIGNED NOT NULL,
  url VARCHAR(1000) NOT NULL,
  events JSON NOT NULL,                   -- ["lead.created"]
  secret VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
