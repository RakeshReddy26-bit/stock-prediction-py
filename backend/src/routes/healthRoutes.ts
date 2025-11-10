import { Router } from 'express';

const router = Router();

// Simple health endpoint used by tests
router.get('/health', (_req, res) => {
	res.json({ status: 'ok', timestamp: Date.now() });
});

export default router;
