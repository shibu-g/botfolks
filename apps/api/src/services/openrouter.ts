import { config } from '../config.js';

const BASE = 'https://openrouter.ai/api/v1';
const headers = () => ({
  Authorization: `Bearer ${config.openrouter.apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://botfolks.in',
  'X-Title': 'Botfolks',
});

export async function embed(texts: string[]): Promise<number[][]> {
  const r = await fetch(`${BASE}/embeddings`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ model: config.openrouter.embedModel, input: texts }),
  });
  if (!r.ok) throw new Error(`Embedding failed: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as { data: { embedding: number[] }[] };
  return j.data.map((d) => d.embedding);
}

export type ChatMsg = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string };

export const SAVE_LEAD_TOOL = {
  type: 'function',
  function: {
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
} as const;

/** Streams tokens via onToken; returns usage + any tool call. */
export async function chatStream(
  messages: ChatMsg[],
  onToken: (t: string) => void,
  model = config.openrouter.chatModel,
) {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model,
      models: [model, config.openrouter.fallbackModel], // OpenRouter fallback
      messages,
      tools: [SAVE_LEAD_TOOL],
      stream: true,
      max_tokens: 600,
      temperature: 0.3,
      usage: { include: true },
      // Some free models default to emitting long chain-of-thought in `reasoning`
      // before any real `content` — with a capped max_tokens that can eat the whole
      // budget and leave the actual reply empty. We only ever read `delta.content`,
      // so turn reasoning off rather than silently losing replies.
      reasoning: { enabled: false },
    }),
  });
  if (!r.ok || !r.body) throw new Error(`Chat failed: ${r.status}`);

  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '', full = '';
  let toolArgs = '', toolName = '';
  let usage: { prompt_tokens: number; completion_tokens: number; cost?: number } | undefined;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const j = JSON.parse(data);
        const delta = j.choices?.[0]?.delta;
        if (delta?.content) { full += delta.content; onToken(delta.content); }
        const tc = delta?.tool_calls?.[0];
        if (tc?.function?.name) toolName = tc.function.name;
        if (tc?.function?.arguments) toolArgs += tc.function.arguments;
        if (j.usage) usage = j.usage;
      } catch { /* keep-alive comment */ }
    }
  }
  return { text: full, usage, toolCall: toolName ? { name: toolName, args: toolArgs } : null };
}
