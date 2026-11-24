import { createHash } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import type { TrainJob } from '@botfolks/shared';
import { db, VEC_SQL, vecParam } from '../lib/db.js';
import { env } from '../lib/env.js';
import { chunkText } from '../lib/chunker.js';
import { embedBatch } from '../lib/embed.js';
import { fileToText, htmlToText, sameSiteLinks } from '../lib/extract.js';

type Doc = { url: string; title: string; text: string };

async function crawl(startUrl: string, maxPages: number): Promise<Doc[]> {
  const queue = [startUrl];
  const seen = new Set<string>();
  const docs: Doc[] = [];
  while (queue.length && docs.length < maxPages) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'BotfolksBot/1.0 (+https://botfolks.in)' } });
      if (!r.ok || !r.headers.get('content-type')?.includes('text/html')) continue;
      const html = await r.text();
      const { title, text } = htmlToText(html);
      if (text.length > 200) docs.push({ url, title, text });
      for (const l of sameSiteLinks(html, url)) if (!seen.has(l)) queue.push(l);
    } catch { /* skip page */ }
  }
  return docs;
}

async function sitemapUrls(sitemap: string): Promise<string[]> {
  const xml = await (await fetch(sitemap)).text();
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}

export async function runTrain({ botId, sourceId }: TrainJob) {
  const [[src]] = (await db.query<RowDataPacket[]>('SELECT * FROM sources WHERE id = ?', [sourceId])) as any;
  if (!src) return;
  await db.query(`UPDATE sources SET status = 'processing', error = NULL WHERE id = ?`, [sourceId]);

  try {
    let docs: Doc[] = [];
    if (src.type === 'url') docs = await crawl(src.ref, env.maxPages);
    else if (src.type === 'sitemap') {
      const urls = (await sitemapUrls(src.ref)).slice(0, env.maxPages);
      for (const u of urls) docs.push(...(await crawl(u, 1)));
    } else if (src.type === 'file') {
      const name: string = (typeof src.meta_json === 'string' ? JSON.parse(src.meta_json) : src.meta_json)?.name ?? 'file.txt';
      docs = [{ url: name, title: name, text: await fileToText(src.ref, name) }];
    } else if (src.type === 'text') docs = [{ url: 'text', title: 'Text', text: src.ref }];

    const allText = docs.map((d) => d.text).join('\n');
    const hash = createHash('sha256').update(allText).digest('hex');
    if (hash === src.content_hash) {
      await db.query(`UPDATE sources SET status = 'done', last_synced_at = NOW() WHERE id = ?`, [sourceId]);
      return; // nothing changed — skip re-embedding
    }

    const items = docs.flatMap((d) => chunkText(d.text).map((c) => ({ content: c, meta: { url: d.url, title: d.title } })));
    const vectors = await embedBatch(items.map((i) => i.content));

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM chunks WHERE source_id = ?', [sourceId]);
      for (let i = 0; i < items.length; i++) {
        await conn.query(
          `INSERT INTO chunks (bot_id, source_id, content, meta_json, embedding) VALUES (?, ?, ?, ?, ${VEC_SQL})`,
          [botId, sourceId, items[i].content, JSON.stringify(items[i].meta), vecParam(vectors[i])]);
      }
      await conn.query(`UPDATE sources SET status = 'done', content_hash = ?, last_synced_at = NOW() WHERE id = ?`, [hash, sourceId]);
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

    console.log(`bot ${botId} source ${sourceId}: ${docs.length} pages, ${items.length} chunks`);
  } catch (e) {
    await db.query(`UPDATE sources SET status = 'error', error = ? WHERE id = ?`, [String(e).slice(0, 1000), sourceId]);
    throw e;
  } finally {
    // Bot is ready when no source is still pending/processing
    await db.query(
      `UPDATE bots SET status = IF((SELECT COUNT(*) FROM sources WHERE bot_id = ? AND status IN ('pending','processing')) = 0, 'ready', 'training') WHERE id = ?`,
      [botId, botId]);
  }
}
