import { URL } from 'url';

type FetchResult = { ok: boolean; status: number; data: any };

async function safeFetch(input: string, init?: RequestInit, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...(init || {}), signal: controller.signal } as RequestInit);
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function predict(ticker: string, days = 30): Promise<FetchResult> {
  const FASTAPI_URL = process.env.FASTAPI_URL;
  if (!FASTAPI_URL) return { ok: false, status: 0, data: { error: 'FastAPI URL not configured' } };
  try {
    const url = `${FASTAPI_URL.replace(/\/$/, '')}/api/v1/predict`;
    const r = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: String(ticker).toUpperCase(), days: Number(days) || 30 }),
    });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch (e: any) {
    return { ok: false, status: 0, data: { error: e?.message || 'Network error' } };
  }
}

async function health(): Promise<FetchResult> {
  const FASTAPI_URL = process.env.FASTAPI_URL;
  if (!FASTAPI_URL) return { ok: false, status: 0, data: { error: 'FastAPI URL not configured' } };
  try {
    const url = `${FASTAPI_URL.replace(/\/$/, '')}/api/v1/health`;
    const r = await safeFetch(url, { method: 'GET' });
    return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
  } catch (e: any) {
    return { ok: false, status: 0, data: { error: e?.message || 'Network error' } };
  }
}

async function models(): Promise<FetchResult> {
  const FASTAPI_URL = process.env.FASTAPI_URL;
  if (!FASTAPI_URL) return { ok: false, status: 0, data: { error: 'FastAPI URL not configured' } };
  try {
    const url = `${FASTAPI_URL.replace(/\/$/, '')}/api/v1/models`;
    const r = await safeFetch(url, { method: 'GET' });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch (e: any) {
    return { ok: false, status: 0, data: { error: e?.message || 'Network error' } };
  }
}

export { predict, health, models };
