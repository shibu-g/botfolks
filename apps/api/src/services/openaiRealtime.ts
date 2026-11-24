import { createHash } from 'node:crypto';
import { config } from '../config.js';

const BASE = 'https://api.openai.com/v1/realtime';

export type RealtimeTool = {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

/** Mints a short-lived client secret the widget uses to connect directly to OpenAI over WebRTC. */
export async function mintClientSecret(opts: {
  instructions: string;
  tools: readonly RealtimeTool[];
  expiresInSeconds: number;
  safetyId: string;
}) {
  const r = await fetch(`${BASE}/client_secrets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Safety-Identifier': opts.safetyId,
    },
    body: JSON.stringify({
      expires_after: { anchor: 'created_at', seconds: opts.expiresInSeconds },
      session: {
        type: 'realtime',
        model: config.openai.realtimeModel,
        instructions: opts.instructions,
        tools: opts.tools,
        tool_choice: 'auto',
        audio: { output: { voice: config.openai.voice } },
      },
    }),
  });
  if (!r.ok) throw new Error(`OpenAI realtime session failed: ${r.status} ${await r.text()}`);
  return (await r.json()) as { value: string; expires_at?: number };
}

/** Stable per-visitor identifier for OpenAI's abuse-monitoring header — never raw PII. */
export function safetyIdFor(botKey: string, visitorId: string) {
  return createHash('sha256').update(`${botKey}:${visitorId}`).digest('hex').slice(0, 64);
}
