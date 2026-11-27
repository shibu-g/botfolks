import { randomBytes } from 'node:crypto';
import Hashids from 'hashids';

export const publicKey = () => randomBytes(12).toString('hex'); // 24 chars

// Short, reversible, non-sequential codes for bot ids shown in dashboard URLs
// (e.g. /bots/<code>) instead of the raw auto-increment id. Not a security
// boundary — every lookup still checks workspace ownership — just keeps
// internal row counts out of the address bar.
const botIdHashids = new Hashids('botfolks-bot-id', 4, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

export const encodeBotId = (id: number) => botIdHashids.encode(id);

export function decodeBotId(code: string): number | null {
  // hashids throws (rather than returning []) for input containing characters
  // outside its alphabet, so any malformed/garbage code in a URL needs a catch.
  try {
    const [id] = botIdHashids.decode(code);
    return typeof id === 'number' ? id : null;
  } catch {
    return null;
  }
}
