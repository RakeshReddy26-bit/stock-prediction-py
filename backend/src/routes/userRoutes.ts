import { Router } from 'express';

const router = Router();

// Minimal user routes for tests - real implementations live in controllers
router.get('/', (_req, res) => {
	res.json({ success: true, message: 'users route ok' });
});

export default router;
