-- Lets a logged-out visitor pay for a plan before an account exists: the
-- public checkout route stashes the email/password here and hands Dodo the
-- row's id as checkout metadata, then the webhook creates the real
-- users/workspaces rows once the payment actually completes.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS pending_signups (
  id CHAR(32) PRIMARY KEY,                -- random token, echoed back via Dodo checkout metadata
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  plan_id VARCHAR(32) NOT NULL,
  status ENUM('pending','completed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (email)
);
