import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ANSWERS_PER_CHAT, PLANS, creditsForVoiceSeconds, type PlanId } from '@botfolks/shared';
import { db } from '../lib/db.js';

const period = () => new Date().toISOString().slice(0, 7);

/** Called before each AI answer. Returns false if workspace is out of chats/credits. */
export async function canAnswer(workspaceId: number, planId: PlanId, aiAnswersSoFar: number) {
  const startsNewChat = aiAnswersSoFar % ANSWERS_PER_CHAT === 0;
  if (!startsNewChat) return true;
  if (planId === 'free') {
    const [w] = await db.query<RowDataPacket[]>('SELECT balance FROM credit_wallets WHERE workspace_id = ?', [workspaceId]);
    return (w[0]?.balance ?? 0) > 0;
  }
  return true; // paid plans: included chats, then overage billed at period end
}

/** Called after each AI answer; bills a chat every ANSWERS_PER_CHAT answers. */
export async function recordAnswer(workspaceId: number, planId: PlanId, conversationId: number, aiAnswersSoFar: number) {
  await db.query('UPDATE conversations SET ai_answers = ai_answers + 1 WHERE id = ?', [conversationId]);
  if (aiAnswersSoFar % ANSWERS_PER_CHAT !== 0) return;

  await db.query('UPDATE conversations SET billed_chats = billed_chats + 1 WHERE id = ?', [conversationId]);

  if (planId === 'free') {
    const [r] = await db.query<ResultSetHeader>(
      'UPDATE credit_wallets SET balance = balance - 1 WHERE workspace_id = ? AND balance > 0', [workspaceId]);
    if (r.affectedRows) {
      await db.query(
        `INSERT INTO credit_transactions (workspace_id, delta, reason, ref) VALUES (?, -1, 'chat', ?)`,
        [workspaceId, String(conversationId)]);
    }
    return;
  }

  const included = PLANS[planId].chats;
  await db.query(
    `INSERT INTO usage_monthly (workspace_id, period, chats) VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE chats = chats + 1,
       overage_chats = overage_chats + IF(chats > ?, 1, 0)`,
    [workspaceId, period(), included]);
}

/** Current credit balance — the pool voice calls are metered from, same as free-plan chat overage. */
export async function creditBalance(workspaceId: number) {
  const [w] = await db.query<RowDataPacket[]>('SELECT balance FROM credit_wallets WHERE workspace_id = ?', [workspaceId]);
  return w[0]?.balance ?? 0;
}

/** Deducts the credits a voice call used; logs the transaction even if the wallet can only cover part of it. */
export async function chargeVoiceSeconds(workspaceId: number, seconds: number, sessionId: number) {
  const credits = creditsForVoiceSeconds(seconds);
  if (credits <= 0) return 0;

  const [r] = await db.query<ResultSetHeader>(
    'UPDATE credit_wallets SET balance = balance - ? WHERE workspace_id = ? AND balance >= ?',
    [credits, workspaceId, credits]);
  if (!r.affectedRows) await db.query('UPDATE credit_wallets SET balance = 0 WHERE workspace_id = ?', [workspaceId]);

  await db.query(
    `INSERT INTO credit_transactions (workspace_id, delta, reason, ref) VALUES (?, ?, 'voice', ?)`,
    [workspaceId, -credits, String(sessionId)]);
  return credits;
}
