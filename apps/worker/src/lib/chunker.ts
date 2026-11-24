import { getEncoding } from 'js-tiktoken';

const enc = getEncoding('cl100k_base');

/** Split text into ~600-token chunks with 100-token overlap, on paragraph boundaries where possible. */
export function chunkText(text: string, size = 600, overlap = 100): string[] {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur: number[] = [];

  for (const p of paras) {
    const toks = enc.encode(p + '\n\n');
    if (cur.length + toks.length > size && cur.length) {
      chunks.push(enc.decode(cur).trim());
      cur = cur.slice(-overlap);
    }
    if (toks.length > size) {
      for (let i = 0; i < toks.length; i += size - overlap) chunks.push(enc.decode(toks.slice(i, i + size)).trim());
      cur = [];
    } else cur.push(...toks);
  }
  if (cur.length) chunks.push(enc.decode(cur).trim());
  return chunks.filter((c) => c.length > 40);
}
