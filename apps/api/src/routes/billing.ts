import crypto from 'crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CREDIT_PACKS, FREE_BONUS_CREDITS, PLANS, checkoutSchema, publicCheckoutSchema, type PlanId } from '@botfolks/shared';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config.js';
import { dodo, dodoWebhook } from '../lib/dodo.js';
import { db } from '../lib/db.js';

export const billing = Router();

billing.get('/plans', (_req, res) => res.json({ plans: PLANS, packs: CREDIT_PACKS }));

const DODO_PRODUCTS: Record<'starter' | 'growth' | 'agency', string> = {
  starter: config.dodo.products.starter,
  growth: config.dodo.products.growth,
  agency: config.dodo.products.agency,
};

billing.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const { planId } = checkoutSchema.parse(req.body);
    const productId = DODO_PRODUCTS[planId];
    if (!productId) {
      return res.status(400).json({
        error: `Dodo product not configured for "${planId}" yet — create a Product in the Dodo dashboard and set DODO_PRODUCT_${planId.toUpperCase()} in .env`,
      });
    }

    const [rows] = await db.query<RowDataPacket[]>('SELECT email, name FROM users WHERE id = ?', [req.user!.userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: user.email, name: user.name || user.email },
      return_url: `${config.appUrl}/billing?checkout=success`,
    });
    res.json({ url: session.checkout_url });
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ error: 'Invalid plan' });
    if (e?.status) return res.status(502).json({ error: 'Dodo Payments request failed', detail: e?.message });
    next(e);
  }
});

// Lets a logged-out visitor buy a plan without signing up first: stash the
// account details in `pending_signups` and hand Dodo the row's id as
// metadata, so the webhook below can create the real account once (and only
// once) the payment actually goes through.
billing.post('/public-checkout', rateLimit({ windowMs: 15 * 60_000, limit: 20 }), async (req, res, next) => {
  try {
    const { name, email, password, planId } = publicCheckoutSchema.parse(req.body);
    const productId = DODO_PRODUCTS[planId];
    if (!productId) {
      return res.status(400).json({
        error: `Dodo product not configured for "${planId}" yet — create a Product in the Dodo dashboard and set DODO_PRODUCT_${planId.toUpperCase()} in .env`,
      });
    }

    const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (existing[0]) return res.status(409).json({ error: 'That email already has an account — log in to upgrade your plan instead.' });

    const id = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(password, 11);
    await db.query(
      'INSERT INTO pending_signups (id, email, password_hash, name, plan_id) VALUES (?, ?, ?, ?, ?)',
      [id, email, passwordHash, name, planId],
    );

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email, name },
      return_url: `${config.appUrl}/login?checkout=success`,
      metadata: { pendingSignupId: id },
    });
    res.json({ url: session.checkout_url });
  } catch (e: any) {
    if (e?.name === 'ZodError') return res.status(400).json({ error: 'Please check your name, email and password and try again.' });
    if (e?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That email already has an account — log in to upgrade your plan instead.' });
    if (e?.status) return res.status(502).json({ error: 'Dodo Payments request failed', detail: e?.message });
    next(e);
  }
});

// Creates the real user/workspace the first time a pending signup's payment
// clears. If the shopper (or someone else) already signed up normally with
// that email in the meantime, reuses that account instead of erroring.
async function completePendingSignup(pendingSignupId: string): Promise<number | undefined> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT email, password_hash, name FROM pending_signups WHERE id = ? AND status = 'pending'`,
    [pendingSignupId],
  );
  const pending = rows[0];
  if (!pending) return undefined;

  const [existingUsers] = await db.query<RowDataPacket[]>(
    `SELECT m.workspace_id FROM users u JOIN workspace_members m ON m.user_id = u.id WHERE u.email = ? LIMIT 1`,
    [pending.email],
  );

  let workspaceId: number;
  if (existingUsers[0]) {
    workspaceId = existingUsers[0].workspace_id;
  } else {
    const [u] = await db.query<ResultSetHeader>(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [pending.email, pending.password_hash, pending.name],
    );
    const [w] = await db.query<ResultSetHeader>('INSERT INTO workspaces (name, owner_id) VALUES (?, ?)', [`${pending.name}'s workspace`, u.insertId]);
    await db.query(`INSERT INTO workspace_members VALUES (?, ?, 'owner')`, [w.insertId, u.insertId]);
    await db.query('INSERT INTO credit_wallets (workspace_id, balance) VALUES (?, ?)', [w.insertId, FREE_BONUS_CREDITS]);
    await db.query(`INSERT INTO credit_transactions (workspace_id, delta, reason) VALUES (?, ?, 'bonus')`, [w.insertId, FREE_BONUS_CREDITS]);
    workspaceId = w.insertId;
  }

  await db.query(`UPDATE pending_signups SET status = 'completed' WHERE id = ?`, [pendingSignupId]);
  return workspaceId;
}

// Dodo dashboard > Webhooks > add endpoint pointing at /v1/billing/webhook/dodo,
// then copy the whsec_... secret it gives you into DODO_WEBHOOK_SECRET.
billing.post('/webhook/dodo', async (req, res) => {
  if (!dodoWebhook) return res.status(503).json({ error: 'DODO_WEBHOOK_SECRET not configured' });

  try {
    const raw = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body);
    await dodoWebhook.verify(raw, {
      'webhook-id': String(req.headers['webhook-id'] ?? ''),
      'webhook-signature': String(req.headers['webhook-signature'] ?? ''),
      'webhook-timestamp': String(req.headers['webhook-timestamp'] ?? ''),
    });
  } catch {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Ack immediately — Dodo retries on non-2xx, and failures below are ours to
  // chase in logs, not something a retry would fix.
  res.json({ received: true });

  try {
    const { type, data } = req.body as { type?: string; data?: any };
    if (data?.payload_type !== 'Subscription') return;

    const planId = (Object.keys(DODO_PRODUCTS) as PlanId[]).find((id) => DODO_PRODUCTS[id as keyof typeof DODO_PRODUCTS] === data.product_id);
    if (!planId) return;

    const pendingSignupId = data?.metadata?.pendingSignupId as string | undefined;
    let workspaceId = pendingSignupId ? await completePendingSignup(pendingSignupId) : undefined;

    if (!workspaceId && data?.customer?.email) {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT w.id AS workspaceId FROM users u JOIN workspaces w ON w.owner_id = u.id WHERE u.email = ? LIMIT 1`,
        [data.customer.email],
      );
      workspaceId = rows[0]?.workspaceId;
    }
    if (!workspaceId) return;

    if (type === 'subscription.active' || type === 'subscription.renewed') {
      const periodEnd = data.next_billing_date ? new Date(data.next_billing_date) : new Date(Date.now() + 31 * 864e5);
      await db.query(
        `INSERT INTO subscriptions (workspace_id, plan_id, billing_cycle, provider, provider_sub_id, status, current_period_end)
         VALUES (?, ?, 'monthly', 'dodo', ?, 'active', ?)
         ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id), status = 'active', current_period_end = VALUES(current_period_end)`,
        [workspaceId, planId, data.subscription_id, periodEnd],
      );
      await db.query('UPDATE workspaces SET plan_id = ? WHERE id = ?', [planId, workspaceId]);
    } else if (['subscription.cancelled', 'subscription.canceled', 'subscription.failed', 'subscription.expired'].includes(type ?? '')) {
      await db.query(`UPDATE subscriptions SET status = 'canceled' WHERE provider_sub_id = ?`, [data.subscription_id]);
    }
  } catch (e) {
    console.error('Dodo webhook processing failed:', e);
  }
});
