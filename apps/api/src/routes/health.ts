import { Router } from 'express';
import { db } from '../lib/db.js';
import { redis } from '../lib/queue.js';

export const health = Router();
health.get('/', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    if (redis) await redis.ping();
    res.json({ ok: true });
  } catch (e) {
    res.status(503).json({ ok: false, error: String(e) });
  }
});
