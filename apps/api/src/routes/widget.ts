import { Router } from 'express';
import cors from 'cors';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import {
  chatMessageSchema, leadSchema, voiceSessionSchema, voiceSessionEndSchema, voiceToolSchema,
  VOICE_ENABLED_PLANS, VOICE_MAX_SESSION_SECONDS, VOICE_MIN_SESSION_SECONDS, voiceSecondsAffordable,
  type PlanId,
} from '@botfolks/shared';
import { db } from '../lib/db.js';
import { buildSystemPrompt, buildVoiceInstructions, retrieve, VOICE_TOOLS } from '../services/retrieval.js';
import { chatStream, type ChatMsg } from '../services/openrouter.js';
import { canAnswer, recordAnswer, creditBalance, chargeVoiceSeconds } from '../services/billing.js';
import { mintClientSecret, safetyIdFor } from '../services/openaiRealtime.js';

/** Public endpoints called by the embedded widget on customer sites. */
export const widget = Router();
widget.use(cors({ origin: true }));

async function botByKey(key: string) {
  const [r] = await db.query<RowDataPacket[]>(
    `SELECT b.*, w.plan_id, w.brand_json FROM bots b JOIN workspaces w ON w.id = b.workspace_id
      WHERE b.public_key = ?`, [key]);
  return r[0];
}

function originAllowed(bot: any, origin?: string) {
  const allowed: string[] | null = bot.allowed_domains ? JSON.parse(bot.allowed_domains) : null;
  if (!allowed?.length || !origin) return true;
  const host = new URL(origin).hostname;
  return allowed.some((d) => host === d || host.endsWith(`.${d}`));
}

widget.get('/config/:key', async (req, res) => {
  const bot = await botByKey(req.params.key);
  if (!bot) return res.sendStatus(404);
  res.json({
    name: bot.name,
    welcome: bot.welcome_message,
    theme: bot.theme_json ? JSON.parse(bot.theme_json) : {},
    leadCapture: !!bot.lead_capture,
    hideBranding: bot.plan_id === 'agency',
    voice: !!bot.voice_enabled && VOICE_ENABLED_PLANS.includes(bot.plan_id as PlanId),
    live: !!bot.is_live,
  });
});

widget.post('/chat', async (req, res, next) => {
  try {
    const input = chatMessageSchema.parse(req.body);
    const bot = await botByKey(input.botKey);
    if (!bot) return res.sendStatus(404);
    if (!originAllowed(bot, req.headers.origin)) return res.status(403).json({ error: 'Domain not allowed' });
    if (!bot.is_live) return res.status(403).json({ error: 'This assistant is currently paused.' });

    let convId = input.conversationId;
    if (!convId) {
      const [c] = await db.query<ResultSetHeader>('INSERT INTO conversations (bot_id, visitor_id, page_url) VALUES (?, ?, ?)',
        [bot.id, input.visitorId, input.pageUrl ?? null]);
      convId = c.insertId;
    }
    const [[conv]] = await db.query<RowDataPacket[]>('SELECT ai_answers FROM conversations WHERE id = ? AND bot_id = ?', [convId, bot.id]) as any;
    if (!conv) return res.sendStatus(404);

    const plan = bot.plan_id as PlanId;
    if (!(await canAnswer(bot.workspace_id, plan, conv.ai_answers))) {
      return res.status(402).json({ error: 'This assistant is temporarily unavailable. Please leave your email and we will get back to you.' });
    }

    await db.query(`INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)`, [convId, input.message]);

    // SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    send('meta', { conversationId: convId });

    const { qaAnswer, chunks } = await retrieve(bot.id, input.message);
    let answer = '';
    let usage: any;

    if (qaAnswer) {
      answer = qaAnswer;
      send('token', qaAnswer);
    } else {
      const [hist] = await db.query<RowDataPacket[]>(
        'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 10', [convId]);
      const messages: ChatMsg[] = [
        { role: 'system', content: buildSystemPrompt(bot.name, bot.system_prompt, chunks) },
        ...hist.reverse().map((m) => ({ role: m.role, content: m.content }) as ChatMsg),
      ];
      const out = await chatStream(messages, (t) => send('token', t), bot.model ?? undefined);
      answer = out.text;
      usage = out.usage;
      if (out.toolCall?.name === 'save_lead' && bot.lead_capture) {
        const lead = leadSchema.safeParse(JSON.parse(out.toolCall.args || '{}'));
        if (lead.success) {
          await db.query('INSERT INTO leads (bot_id, conversation_id, name, email, phone, need) VALUES (?, ?, ?, ?, ?, ?)',
            [bot.id, convId, lead.data.name ?? null, lead.data.email ?? null, lead.data.phone ?? null, lead.data.need ?? null]);
          if (!answer) { answer = 'Thanks! Our team will contact you soon.'; send('token', answer); }
        }
      }
    }

    await db.query(
      `INSERT INTO messages (conversation_id, role, content, tokens_in, tokens_out, cost_micro_usd) VALUES (?, 'assistant', ?, ?, ?, ?)`,
      [convId, answer, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0, Math.round((usage?.cost ?? 0) * 1e6)]);
    await recordAnswer(bot.workspace_id, plan, convId!, conv.ai_answers);

    send('done', {});
    res.end();
  } catch (e) {
    if (res.headersSent) { res.write(`event: error\ndata: {}\n\n`); return res.end(); }
    next(e);
  }
});

// Voice chat — mints a short-lived OpenAI Realtime client secret the widget
// connects to directly over WebRTC (lowest latency; the real API key never
// leaves the server). Growth/Agency only, metered from the credit wallet.
widget.post('/voice/session', async (req, res, next) => {
  try {
    const input = voiceSessionSchema.parse(req.body);
    const bot = await botByKey(input.botKey);
    if (!bot) return res.sendStatus(404);
    if (!originAllowed(bot, req.headers.origin)) return res.status(403).json({ error: 'Domain not allowed' });
    if (!bot.is_live) return res.status(403).json({ error: 'This assistant is currently paused.' });

    const plan = bot.plan_id as PlanId;
    if (!VOICE_ENABLED_PLANS.includes(plan)) {
      return res.status(403).json({ error: 'Voice chat is available on the Growth and Agency plans.' });
    }
    if (!bot.voice_enabled) {
      return res.status(403).json({ error: 'Voice chat is not enabled for this bot.' });
    }

    const balance = await creditBalance(bot.workspace_id);
    const affordable = Math.min(voiceSecondsAffordable(balance), VOICE_MAX_SESSION_SECONDS);
    if (affordable < VOICE_MIN_SESSION_SECONDS) {
      return res.status(402).json({ error: 'Not enough credits for a voice call. Please top up.' });
    }

    let convId = input.conversationId;
    if (!convId) {
      const [c] = await db.query<ResultSetHeader>(
        'INSERT INTO conversations (bot_id, visitor_id, page_url) VALUES (?, ?, ?)',
        [bot.id, input.visitorId, input.pageUrl ?? null]);
      convId = c.insertId;
    }

    const [s] = await db.query<ResultSetHeader>(
      `INSERT INTO voice_sessions (bot_id, workspace_id, conversation_id, visitor_id) VALUES (?, ?, ?, ?)`,
      [bot.id, bot.workspace_id, convId, input.visitorId]);

    const instructions = buildVoiceInstructions(bot.name, bot.system_prompt);
    const secret = await mintClientSecret({
      instructions,
      tools: VOICE_TOOLS,
      expiresInSeconds: affordable,
      safetyId: safetyIdFor(bot.public_key, input.visitorId),
    });

    res.json({
      sessionId: s.insertId,
      conversationId: convId,
      clientSecret: secret.value,
      maxSeconds: affordable,
    });
  } catch (e) { next(e); }
});

// Browser->OpenAI tool calls are routed back here so DB access (RAG, leads)
// never has to be exposed to the widget's realtime session directly.
widget.post('/voice/tool', async (req, res, next) => {
  try {
    const input = voiceToolSchema.parse(req.body);
    const bot = await botByKey(input.botKey);
    if (!bot) return res.sendStatus(404);
    if (!originAllowed(bot, req.headers.origin)) return res.status(403).json({ error: 'Domain not allowed' });

    let args: any = {};
    try { args = JSON.parse(input.arguments || '{}'); } catch { /* leave empty */ }

    if (input.name === 'search_knowledge_base') {
      const { qaAnswer, chunks } = await retrieve(bot.id, String(args.query ?? ''));
      return res.json({ result: qaAnswer ?? (chunks.join('\n\n') || 'No relevant information found.') });
    }

    if (input.name === 'save_lead') {
      if (!bot.lead_capture) return res.json({ result: 'Lead capture is not enabled for this bot.' });
      const lead = leadSchema.safeParse(args);
      if (!lead.success) return res.json({ result: 'Could not save — missing details.' });
      await db.query('INSERT INTO leads (bot_id, conversation_id, name, email, phone, need) VALUES (?, ?, ?, ?, ?, ?)',
        [bot.id, input.conversationId ?? null, lead.data.name ?? null, lead.data.email ?? null, lead.data.phone ?? null, lead.data.need ?? null]);
      return res.json({ result: 'Saved. Thanks!' });
    }

    res.json({ result: 'Unknown tool.' });
  } catch (e) { next(e); }
});

// Widget calls this on hangup (and on page unload, via fetch keepalive) to bill
// the call. Billed seconds are capped at real wall-clock elapsed time, so a
// spoofed `seconds` value can only ever *undercharge*, never overcharge.
widget.post('/voice/session/:id/end', async (req, res, next) => {
  try {
    const input = voiceSessionEndSchema.parse(req.body);
    const bot = await botByKey(input.botKey);
    if (!bot) return res.sendStatus(404);

    const [[row]] = await db.query<RowDataPacket[]>(
      'SELECT bot_id, workspace_id, started_at, ended_at FROM voice_sessions WHERE id = ?', [req.params.id]) as any;
    if (!row || Number(row.bot_id) !== Number(bot.id)) return res.sendStatus(404);
    if (row.ended_at) return res.json({ ok: true });

    const wallClockSeconds = Math.floor((Date.now() - new Date(row.started_at).getTime()) / 1000);
    const billedSeconds = Math.max(0, Math.min(input.seconds, wallClockSeconds, VOICE_MAX_SESSION_SECONDS));
    const credits = await chargeVoiceSeconds(row.workspace_id, billedSeconds, Number(req.params.id));

    await db.query('UPDATE voice_sessions SET ended_at = NOW(), seconds = ?, credits_charged = ? WHERE id = ?',
      [billedSeconds, credits, req.params.id]);
    res.json({ ok: true, creditsCharged: credits });
  } catch (e) { next(e); }
});

// Manual lead form (when visitor fills the form in the widget)
widget.post('/lead/:key', async (req, res, next) => {
  try {
    const bot = await botByKey(req.params.key);
    if (!bot) return res.sendStatus(404);
    const lead = leadSchema.parse(req.body);
    await db.query('INSERT INTO leads (bot_id, name, email, phone, need) VALUES (?, ?, ?, ?, ?)',
      [bot.id, lead.name ?? null, lead.email ?? null, lead.phone ?? null, lead.need ?? null]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
