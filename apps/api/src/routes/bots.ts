import { Router } from 'express';
import multer from 'multer';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { createBotSchema, PLANS, VOICE_ENABLED_PLANS, type PlanId } from '@botfolks/shared';
import { db } from '../lib/db.js';
import { VEC_SQL, vecParam } from '../lib/vector.js';
import { publicKey } from '../lib/ids.js';
import { trainQueue } from '../lib/queue.js';
import { requireAuth } from '../middleware/auth.js';
import { embed } from '../services/openrouter.js';

export const bots = Router();
bots.use(requireAuth);
const upload = multer({ dest: process.env.UPLOAD_DIR ?? '../../uploads', limits: { fileSize: 20 * 1024 * 1024 } });

async function workspacePlan(workspaceId: number): Promise<PlanId> {
  const [r] = await db.query<RowDataPacket[]>('SELECT plan_id FROM workspaces WHERE id = ?', [workspaceId]);
  return r[0].plan_id;
}

async function ownBot(botId: number, workspaceId: number) {
  const [r] = await db.query<RowDataPacket[]>('SELECT * FROM bots WHERE id = ? AND workspace_id = ?', [botId, workspaceId]);
  return r[0];
}

bots.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM bots WHERE workspace_id = ? ORDER BY id DESC', [req.user!.workspaceId]);
  res.json(rows);
});

// Workspace-wide usage analytics for the dashboard landing page. Must be registered
// before GET /:id, or Express would try to look up a bot with id "analytics".
bots.get('/analytics', async (req, res) => {
  const ws = req.user!.workspaceId;

  const [[{ totalBots }]] = await db.query<RowDataPacket[]>(
    'SELECT COUNT(*) totalBots FROM bots WHERE workspace_id = ?', [ws]) as any;

  const [[{ chatsThisMonth }]] = await db.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(c.billed_chats), 0) chatsThisMonth
     FROM conversations c JOIN bots b ON b.id = c.bot_id
     WHERE b.workspace_id = ? AND c.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`, [ws]) as any;

  const [[{ leadsThisMonth }]] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) leadsThisMonth
     FROM leads l JOIN bots b ON b.id = l.bot_id
     WHERE b.workspace_id = ? AND l.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`, [ws]) as any;

  const [dailyRows] = await db.query<RowDataPacket[]>(
    `SELECT DATE(c.created_at) day, COALESCE(SUM(c.billed_chats), 0) chats
     FROM conversations c JOIN bots b ON b.id = c.bot_id
     WHERE b.workspace_id = ? AND c.created_at >= (CURDATE() - INTERVAL 13 DAY)
     GROUP BY DATE(c.created_at)`, [ws]);
  const dailyMap = new Map(dailyRows.map((r) => [new Date(r.day).toISOString().slice(0, 10), Number(r.chats)]));
  const dailyChats = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const date = d.toISOString().slice(0, 10);
    return { date, chats: dailyMap.get(date) ?? 0 };
  });

  const [monthlyRows] = await db.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') period, COUNT(*) count
     FROM bots WHERE workspace_id = ? AND created_at >= (CURDATE() - INTERVAL 5 MONTH)
     GROUP BY period`, [ws]);
  const monthlyMap = new Map(monthlyRows.map((r) => [r.period as string, Number(r.count)]));
  const botsCreated = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const period = d.toISOString().slice(0, 7);
    return { period, count: monthlyMap.get(period) ?? 0 };
  });

  res.json({
    totalBots: Number(totalBots),
    chatsThisMonth: Number(chatsThisMonth),
    leadsThisMonth: Number(leadsThisMonth),
    dailyChats,
    botsCreated,
  });
});

bots.post('/', async (req, res, next) => {
  try {
    const input = createBotSchema.parse(req.body);
    const ws = req.user!.workspaceId;
    const plan = await workspacePlan(ws);
    const [[{ n }]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) n FROM bots WHERE workspace_id = ?', [ws]) as any;
    if (n >= PLANS[plan].bots) return res.status(403).json({ error: `Your ${PLANS[plan].name} plan allows ${PLANS[plan].bots} bot(s). Upgrade to add more.` });

    const [b] = await db.query<ResultSetHeader>(
      'INSERT INTO bots (workspace_id, public_key, name, system_prompt, languages) VALUES (?, ?, ?, ?, ?)',
      [ws, publicKey(), input.name, input.systemPrompt ?? null, JSON.stringify(input.languages)]);

    if (input.websiteUrl) {
      const [s] = await db.query<ResultSetHeader>(`INSERT INTO sources (bot_id, type, ref) VALUES (?, 'url', ?)`, [b.insertId, input.websiteUrl]);
      await db.query(`UPDATE bots SET status = 'training' WHERE id = ?`, [b.insertId]);
      await trainQueue.add('train', { botId: b.insertId, sourceId: s.insertId });
    }
    res.status(201).json({ id: b.insertId });
  } catch (e) { next(e); }
});

bots.get('/:id', async (req, res) => {
  const bot = await ownBot(Number(req.params.id), req.user!.workspaceId);
  if (!bot) return res.sendStatus(404);
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM sources WHERE bot_id = ?', [bot.id]);
  const sources = rows.map((s) => ({ ...s, meta_json: typeof s.meta_json === 'string' ? JSON.parse(s.meta_json) : s.meta_json }));
  res.json({ ...bot, sources });
});

bots.patch('/:id', async (req, res) => {
  const bot = await ownBot(Number(req.params.id), req.user!.workspaceId);
  if (!bot) return res.sendStatus(404);
  const { name, systemPrompt, welcomeMessage, theme, languages, leadCapture, allowedDomains, voiceEnabled, isLive } = req.body;

  if (voiceEnabled) {
    const plan = await workspacePlan(req.user!.workspaceId);
    if (!VOICE_ENABLED_PLANS.includes(plan)) {
      return res.status(403).json({ error: 'Voice chat is available on the Growth and Agency plans.' });
    }
  }

  await db.query(
    `UPDATE bots SET name = COALESCE(?, name), system_prompt = COALESCE(?, system_prompt),
       welcome_message = COALESCE(?, welcome_message), theme_json = COALESCE(?, theme_json),
       languages = COALESCE(?, languages),
       lead_capture = COALESCE(?, lead_capture), voice_enabled = COALESCE(?, voice_enabled),
       is_live = COALESCE(?, is_live),
       allowed_domains = COALESCE(?, allowed_domains) WHERE id = ?`,
    [name, systemPrompt, welcomeMessage, theme ? JSON.stringify(theme) : null,
     Array.isArray(languages) ? JSON.stringify(languages) : null, leadCapture,
     typeof voiceEnabled === 'boolean' ? Number(voiceEnabled) : null,
     typeof isLive === 'boolean' ? Number(isLive) : null,
     allowedDomains ? JSON.stringify(allowedDomains) : null, bot.id]);
  res.json({ ok: true });
});

// Add a URL / sitemap source
bots.post('/:id/sources/url', async (req, res) => {
  const bot = await ownBot(Number(req.params.id), req.user!.workspaceId);
  if (!bot) return res.sendStatus(404);
  const [s] = await db.query<ResultSetHeader>(`INSERT INTO sources (bot_id, type, ref) VALUES (?, ?, ?)`,
    [bot.id, req.body.sitemap ? 'sitemap' : 'url', req.body.url]);
  await trainQueue.add('train', { botId: bot.id, sourceId: s.insertId });
  res.status(201).json({ id: s.insertId });
});

// Upload PDF/DOCX/TXT (paid plans only)
bots.post('/:id/sources/file', upload.single('file'), async (req, res) => {
  const ws = req.user!.workspaceId;
  const bot = await ownBot(Number(req.params.id), ws);
  if (!bot || !req.file) return res.sendStatus(400);
  if (!PLANS[await workspacePlan(ws)].fileTraining) return res.status(403).json({ error: 'File training is available on paid plans.' });
  const [s] = await db.query<ResultSetHeader>(`INSERT INTO sources (bot_id, type, ref, meta_json) VALUES (?, 'file', ?, ?)`,
    [bot.id, req.file.path, JSON.stringify({ name: req.file.originalname })]);
  await trainQueue.add('train', { botId: bot.id, sourceId: s.insertId });
  res.status(201).json({ id: s.insertId });
});

// Q&A pairs (highest priority answers)
bots.post('/:id/qa', async (req, res) => {
  const bot = await ownBot(Number(req.params.id), req.user!.workspaceId);
  if (!bot) return res.sendStatus(404);
  const { question, answer } = req.body as { question: string; answer: string };
  const [v] = await embed([question]);
  await db.query(`INSERT INTO qa_pairs (bot_id, question, answer, embedding) VALUES (?, ?, ?, ${VEC_SQL})`,
    [bot.id, question, answer, vecParam(v)]);
  res.status(201).json({ ok: true });
});

bots.get('/:id/leads', async (req, res) => {
  const bot = await ownBot(Number(req.params.id), req.user!.workspaceId);
  if (!bot) return res.sendStatus(404);
  const [rows] = await db.query('SELECT * FROM leads WHERE bot_id = ? ORDER BY id DESC LIMIT 500', [bot.id]);
  res.json(rows);
});

bots.get('/:id/conversations', async (req, res) => {
  const bot = await ownBot(Number(req.params.id), req.user!.workspaceId);
  if (!bot) return res.sendStatus(404);
  const [rows] = await db.query('SELECT * FROM conversations WHERE bot_id = ? ORDER BY id DESC LIMIT 200', [bot.id]);
  res.json(rows);
});
