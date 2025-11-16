import express, { Request, Response } from 'express';
import { execFile } from 'child_process';
import path from 'path';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { predict as stockPredict, health as stockHealth, models as stockModels } from '../utils/stockClient';

const router = express.Router();

// Local predictor settings: prefer environment variables. If you want to
// use a local python script as a fallback, set LOCAL_PYTHON and
// LOCAL_PREDICTOR_SCRIPT in your environment. Avoid hard-coded repo paths.
const LOCAL_PYTHON = process.env.LOCAL_PYTHON || '';
const LOCAL_PREDICTOR_SCRIPT = process.env.LOCAL_PREDICTOR_SCRIPT || '';

// In some environments (CI or when the stock microservice is intentionally
// kept separate) we should avoid attempting to call the Python FastAPI or
// local predictor. Enable a safe stub by setting SKIP_STOCK_INTEGRATION=true
// or when running tests (NODE_ENV === 'test'). This ensures the e-commerce
// backend tests remain fast and deterministic.
const SKIP_STOCK_INTEGRATION = process.env.SKIP_STOCK_INTEGRATION === 'true' || process.env.NODE_ENV === 'test';

// No hard-coded predictor path. Use LOCAL_PREDICTOR_SCRIPT (can point to
// quick_predict.py or quick_predict_lstm.py) when configured.

// naive in-memory cache (TTL 5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; payload: any }>();

const predictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15, // 15 req/min per IP for stock predictions
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/predict',
  predictLimiter,
  [
    body('ticker').optional().isString().trim().isLength({ min: 1, max: 10 }).withMessage('Invalid ticker'),
    body('period').optional().isString().isIn(['1mo','3mo','6mo','1y','2y','5y','10y','max']).withMessage('Invalid period'),
    body('interval').optional().isString().isIn(['1d','1wk']).withMessage('Invalid interval'),
    body('useLSTM').optional().isBoolean().withMessage('useLSTM must be boolean'),
  body('days').optional().isInt({ min: 1, max: 365 }).withMessage('days must be 1..365'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation error', details: errors.array() });
    }

  const defaultDays = Number(process.env.FASTAPI_DAYS || 30);
  const { ticker = 'AAPL', period = '6mo', interval = '1d', useLSTM = true, noCache = false, days = defaultDays } = req.body || {};

    // cache key
    const key = crypto
      .createHash('sha1')
  .update(JSON.stringify({ t: String(ticker).toUpperCase(), period, interval, days: Number(days), useLSTM }))
      .digest('hex');

    const now = Date.now();
    const entry = cache.get(key);
    if (!noCache && entry && now - entry.at < CACHE_TTL_MS) {
      return res.json(entry.payload);
    }

    const fastapiUrl = process.env.FASTAPI_URL; // e.g., http://127.0.0.1:8010
    if (SKIP_STOCK_INTEGRATION) {
      return res.status(503).json({ success: false, error: 'Stock integration disabled in this environment' });
    }
    if (fastapiUrl) {
      try {
        const result = await stockPredict(String(ticker).toUpperCase(), Number(days) || 30);
        // status === 0 indicates network error / not reachable -> fall back to local script
        if (result.status === 0) {
          // fall through to local script below
        } else if (!result.ok) {
          const detail = (result.data && typeof result.data === 'object' && 'detail' in result.data) ? result.data.detail : 'FastAPI error';
          return res.status(result.status || 502).json({ success: false, error: detail });
        } else {
          const payload = { success: true, data: { ok: true, ...(result.data || {}) } } as const;
          cache.set(key, { at: now, payload });
          return res.json(payload);
        }
      } catch (err: any) {
        // fall back to local script
      }
    }

    // If local predictor is configured, run it. Otherwise return 502 so
    // the caller knows external service is unavailable.
    if (!LOCAL_PYTHON || !LOCAL_PREDICTOR_SCRIPT) {
      return res.status(502).json({ success: false, error: 'No local predictor configured and FastAPI unreachable' });
    }
    const script = LOCAL_PREDICTOR_SCRIPT;
    execFile(
      LOCAL_PYTHON,
      [script, '--ticker', String(ticker), '--period', String(period), '--interval', String(interval)],
      { timeout: 30000 },
      (error, stdout, stderr) => {
        if (error) {
          return res.status(500).json({ success: false, error: error.message, stderr, stdout: stdout?.toString() });
        }
        try {
          const parsed = JSON.parse(stdout.toString().trim() || '{}');
          if (!parsed.ok) {
            return res.status(400).json({ success: false, error: parsed.error || 'Prediction failed' });
          }
          const payload = { success: true, data: parsed };
          cache.set(key, { at: now, payload });
          return res.json(payload);
        } catch (e: any) {
          return res.status(500).json({ success: false, error: 'Failed to parse predictor output', raw: stdout.toString() });
        }
      }
    );
  }
);

// Lightweight health/status for stocks predictor
router.get('/health', async (_req: Request, res: Response) => {
  if (SKIP_STOCK_INTEGRATION) {
    // Deterministic stub for tests/environments where predictor is separate
    return res.json({ success: true, data: { fastapi: { ok: false }, local: false, stub: true } });
  }

  const fastapiUrl = process.env.FASTAPI_URL;
  let fastapi: { ok: boolean; status?: number } = { ok: false };
  if (fastapiUrl) {
    try {
      const r = await stockHealth();
      fastapi = { ok: !!r.ok, status: r.status || undefined };
    } catch {
      fastapi = { ok: false };
    }
  }
  const hasLocal = Boolean(LOCAL_PYTHON && LOCAL_PREDICTOR_SCRIPT);
  return res.json({ success: true, data: { fastapi, local: hasLocal } });
});

// List available trained models from the microservice
router.get('/models', async (_req: Request, res: Response) => {
  const fastapiUrl = process.env.FASTAPI_URL;
  if (!fastapiUrl) {
    return res.status(503).json({ success: false, error: 'FastAPI service URL not configured' });
  }
  try {
    const r = await stockModels();
    if (r.status === 0) return res.status(502).json({ success: false, error: 'Failed to reach FastAPI service' });
    if (!r.ok) {
      const detail = (r.data && typeof r.data === 'object' && 'detail' in r.data) ? r.data.detail : 'FastAPI error';
      return res.status(r.status || 502).json({ success: false, error: detail });
    }
    return res.json({ success: true, data: r.data });
  } catch (e: any) {
    return res.status(502).json({ success: false, error: 'Failed to reach FastAPI service' });
  }
});

export default router;
