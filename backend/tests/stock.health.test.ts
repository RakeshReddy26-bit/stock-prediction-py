import request from 'supertest';
import app from '../src/server';
import { describe, it, expect } from 'vitest';

// This test does not require DB; just pings the health route

describe('Stocks Health', () => {
  it('should return health status for stocks predictor', async () => {
    const res = await request(app).get('/api/stocks/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.local).toBe('boolean');
    // fastapi status object if env set, otherwise ok:false is acceptable
    expect(res.body.data.fastapi).toBeDefined();
  });
});
