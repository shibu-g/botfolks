import { randomBytes } from 'node:crypto';
export const publicKey = () => randomBytes(12).toString('hex'); // 24 chars
