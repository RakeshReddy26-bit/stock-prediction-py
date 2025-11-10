import express from 'express';
import { placeOrder, getOrders, getOrderById } from '../controllers/orderController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/', protect, placeOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);

export default router;