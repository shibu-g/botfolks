const BASE = import.meta.env.VITE_API_URL ?? '';

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const r = await fetch(`${BASE}/v1${path}`, {
    credentials: 'include',
    ...init,
    headers: isForm ? init.headers : { 'Content-Type': 'application/json', ...init.headers },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error ?? `Request failed (${r.status})`);
  return data as T;
}

export const post = <T = any>(path: string, body: unknown) =>
  api<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) });

export async function getBlob(path: string): Promise<{ blob: Blob; filename: string | null }> {
  const r = await fetch(`${BASE}/v1${path}`, { credentials: 'include' });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed (${r.status})`);
  }
  const match = r.headers.get('content-disposition')?.match(/filename="(.+?)"/);
  return { blob: await r.blob(), filename: match?.[1] ?? null };
}

export const patch = <T = any>(path: string, body: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
