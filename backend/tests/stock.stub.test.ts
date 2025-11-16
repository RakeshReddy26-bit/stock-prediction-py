import request from 'supertest';
import app from '../src/server';
import { describe, it, expect } from 'vitest';

// Deterministic assertion: when running under NODE_ENV=test (Vitest), the
// backend returns a stubbed health response for the stock predictor. This
// ensures the backend is test-friendly and does not attempt to call external
// services during automated runs.
describe('Stocks Health Stub', () => {
  it('returns stub when stock integration is disabled (test env)', async () => {
    const res = await request(app).get('/api/stocks/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    // The stub flag is present when integration is disabled
    expect(res.body.data.stub).toBe(true);
    expect(typeof res.body.data.local).toBe('boolean');
  });
});
