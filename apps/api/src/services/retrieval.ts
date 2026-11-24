import type { RowDataPacket } from 'mysql2';
import { db, vecText } from '../lib/db.js';
import { embed } from './openrouter.js';
import { cosineDistance, isJs } from '../lib/vector.js';

const QA_THRESHOLD = 0.12;     // cosine distance — lower = closer
const CHUNK_THRESHOLD = 0.45;

export async function retrieve(botId: number, question: string) {
  const [qVec] = await embed([question]);

  if (isJs) {
    // Local MySQL mode: load this bot's vectors and rank in Node
    const [qa] = await db.query<RowDataPacket[]>('SELECT answer, embedding FROM qa_pairs WHERE bot_id = ?', [botId]);
    let best: { answer: string; d: number } | null = null;
    for (const r of qa) {
      const d = cosineDistance(qVec, JSON.parse(r.embedding));
      if (!best || d < best.d) best = { answer: r.answer, d };
    }
    if (best && best.d < QA_THRESHOLD) return { qaAnswer: best.answer, chunks: [] as string[] };

    const [rows] = await db.query<RowDataPacket[]>('SELECT content, embedding FROM chunks WHERE bot_id = ?', [botId]);
    const chunks = rows
      .map((r) => ({ content: r.content as string, d: cosineDistance(qVec, JSON.parse(r.embedding)) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, 5)
      .filter((r) => r.d < CHUNK_THRESHOLD)
      .map((r) => r.content);
    return { qaAnswer: null, chunks };
  }

  const v = vecText(qVec);

  // 1) Exact-ish Q&A match wins
  const [qa] = await db.query<RowDataPacket[]>(
    `SELECT answer, VEC_DISTANCE_COSINE(embedding, VEC_FromText(?)) AS d
       FROM qa_pairs WHERE bot_id = ? ORDER BY d LIMIT 1`,
    [v, botId],
  );
  if (qa[0] && qa[0].d < QA_THRESHOLD) return { qaAnswer: qa[0].answer as string, chunks: [] as string[] };

  // 2) Top 5 chunks
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT content, meta_json, VEC_DISTANCE_COSINE(embedding, VEC_FromText(?)) AS d
       FROM chunks WHERE bot_id = ? ORDER BY d LIMIT 5`,
    [v, botId],
  );
  const chunks = rows.filter((r) => r.d < CHUNK_THRESHOLD).map((r) => r.content as string);
  return { qaAnswer: null, chunks };
}

export function buildSystemPrompt(botName: string, custom: string | null, chunks: string[], lang?: string) {
  return [
    `You are ${botName}, a friendly customer-support assistant for this business.`,
    custom ?? '',
    'Answer ONLY using the CONTEXT below. If the answer is not in the context, say you are not sure',
    'and offer to take the visitor\'s name and email so the team can follow up (use save_lead).',
    'Keep answers short (2-5 sentences). Never invent prices, policies or links.',
    lang ? `Reply in the visitor's language (${lang}).` : 'Reply in the same language the visitor uses.',
    '',
    'CONTEXT:',
    chunks.length ? chunks.map((c, i) => `[${i + 1}] ${c}`).join('\n\n') : '(no relevant context found)',
  ].join('\n');
}

/** System instructions for a live voice call — there's no per-turn CONTEXT block, so the
 *  model is told to pull facts itself via the search_knowledge_base tool instead. */
export function buildVoiceInstructions(botName: string, custom: string | null, lang?: string) {
  return [
    `You are ${botName}, a friendly customer-support voice assistant for this business, on a live call with a visitor.`,
    custom ?? '',
    'Call search_knowledge_base before answering any factual question about the business — never guess or invent prices, policies or links.',
    'If the knowledge base has no answer, say you are not sure and offer to take the visitor\'s name and email with save_lead so the team can follow up.',
    'Keep spoken answers short and conversational (1-3 sentences) — this is a voice call, not a chat.',
    lang ? `Reply in the visitor's language (${lang}).` : 'Reply in the same language the visitor speaks.',
  ].filter(Boolean).join('\n');
}

export const VOICE_TOOLS = [
  {
    type: 'function',
    name: 'search_knowledge_base',
    description: "Search this business's knowledge base for facts needed to answer the visitor.",
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'What to search for' } },
      required: ['query'],
    },
  },
  {
    type: 'function',
    name: 'save_lead',
    description: 'Save visitor contact details when they share them or want to be contacted.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' }, email: { type: 'string' },
        phone: { type: 'string' }, need: { type: 'string' },
      },
    },
  },
] as const;
