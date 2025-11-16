import express from 'express';
import { getAllServices, getService, createService, updateService, deleteService } from '../controllers/serviceController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getAllServices);
router.get('/:id', protect, getService);
router.post('/', protect, createService);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

export default router; 
