import { config } from '../config.js';

/** native = MariaDB 11.8 VECTOR columns (production). js = JSON text + cosine in Node (local MySQL). */
export const isJs = config.vectorMode === 'js';

/** SQL fragment for inserting an embedding parameter */
export const VEC_SQL = isJs ? '?' : 'VEC_FromText(?)';
export const vecParam = (v: number[]) => (isJs ? JSON.stringify(v) : `[${v.join(',')}]`);

export function cosineDistance(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return 1 - dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
