import { Router } from 'express';
import {
  adjustUserLoyalty,
  getLoyaltyAnalytics,
  exportLoyaltyData,
  schedulePromotion,
} from '../controllers/adminController';
import { protect } from '../middleware/authMiddleware';
import { restrictTo } from '../middleware/roleMiddleware';

const router = Router();

router.patch('/admin/user/:id/loyalty', protect, restrictTo('admin'), adjustUserLoyalty);
router.get('/admin/loyalty/analytics', protect, restrictTo('admin'), getLoyaltyAnalytics);
router.get('/admin/loyalty/export', protect, restrictTo('admin'), exportLoyaltyData);
router.post('/admin/loyalty/promo', protect, restrictTo('admin'), schedulePromotion);

export default router; 