import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { predict, health, models } from '../src/utils/stockClient';

const OLD = (global as any).fetch;

describe('stockClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.FASTAPI_URL = 'http://127.0.0.1:9999';
  });
  afterEach(() => {
    (global as any).fetch = OLD;
  });

  it('predict returns parsed data on success', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true, predictions: [1,2,3] }) });
    const r = await predict('AAPL', 10);
    expect(r.ok).toBe(true);
    expect(r.status).toBe(200);
    expect(r.data).toHaveProperty('predictions');
  });

  it('predict returns status 0 on network error', async () => {
    (global as any).fetch = vi.fn().mockRejectedValue(new Error('net'));
    const r = await predict('AAPL', 10);
    expect(r.status).toBe(0);
    expect(r.ok).toBe(false);
  });

  it('health returns ok info when service responds', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    const r = await health();
    expect(r.ok).toBe(true);
    expect(r.status).toBe(200);
  });

  it('models returns data array', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => (['model1','model2']) });
    const r = await models();
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.data)).toBe(true);
  });
});
