import { env } from './env.js';

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 64) {
    const r = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.openrouterKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.embedModel, input: texts.slice(i, i + 64) }),
    });
    if (!r.ok) throw new Error(`Embed ${r.status}: ${await r.text()}`);
    const j = (await r.json()) as { data: { embedding: number[] }[] };
    out.push(...j.data.map((d) => d.embedding));
  }
  return out;
}
