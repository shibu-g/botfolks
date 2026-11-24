import { Router } from 'express';
import bcrypt from 'bcryptjs';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { loginSchema, signupSchema, FREE_BONUS_CREDITS } from '@botfolks/shared';
import { db } from '../lib/db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

export const auth = Router();
const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 864e5 };

auth.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);
    const hash = await bcrypt.hash(password, 11);
    const [u] = await db.query<ResultSetHeader>('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', [email, hash, name]);
    const [w] = await db.query<ResultSetHeader>('INSERT INTO workspaces (name, owner_id) VALUES (?, ?)', [`${name}'s workspace`, u.insertId]);
    await db.query(`INSERT INTO workspace_members VALUES (?, ?, 'owner')`, [w.insertId, u.insertId]);
    await db.query('INSERT INTO credit_wallets (workspace_id, balance) VALUES (?, ?)', [w.insertId, FREE_BONUS_CREDITS]);
    await db.query(`INSERT INTO credit_transactions (workspace_id, delta, reason) VALUES (?, ?, 'bonus')`, [w.insertId, FREE_BONUS_CREDITS]);
    res.cookie('token', signToken({ userId: u.insertId, workspaceId: w.insertId }), cookieOpts).json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
    next(e);
  }
});

auth.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT u.id, u.password_hash, m.workspace_id FROM users u
         JOIN workspace_members m ON m.user_id = u.id WHERE u.email = ? LIMIT 1`, [email]);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(password, u.password_hash))) return res.status(401).json({ error: 'Wrong email or password' });
    res.cookie('token', signToken({ userId: u.id, workspaceId: u.workspace_id }), cookieOpts).json({ ok: true });
  } catch (e) { next(e); }
});

auth.post('/logout', (_req, res) => res.clearCookie('token').json({ ok: true }));

auth.get('/me', requireAuth, async (req, res) => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.email, u.name, w.id AS workspaceId, w.plan_id AS plan, cw.balance AS credits
       FROM users u JOIN workspaces w ON w.id = ?
       LEFT JOIN credit_wallets cw ON cw.workspace_id = w.id WHERE u.id = ?`,
    [req.user!.workspaceId, req.user!.userId]);
  res.json(rows[0]);
});
