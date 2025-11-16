import express from 'express';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/me', protect, (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

export default router; 
