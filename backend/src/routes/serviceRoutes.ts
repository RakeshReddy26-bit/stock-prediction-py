import { Router } from 'express';
import { getAllServices, getService, createService, updateService, deleteService } from '../controllers/serviceController';
import { protect, restrictTo } from '../middleware/auth';
import { check } from 'express-validator';
import { validate } from '../middleware/validators';

const router = Router();

// Public read routes (tests assert auth header but allow reading)
router.get('/', protect, getAllServices);
router.get('/:id', protect, getService);

// Admin protected routes
const createValidation = [
	check('name').trim().notEmpty().withMessage('Name is required'),
	check('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
	check('duration').isInt({ gt: 0 }).withMessage('Duration must be a positive integer'),
	validate
];

// Update allows partial fields; only validate if present
const updateValidation = [
	check('name').optional().trim().notEmpty().withMessage('Name is required'),
	check('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
	check('duration').optional().isInt({ gt: 0 }).withMessage('Duration must be a positive integer'),
	validate
];

router.post('/', protect, restrictTo('admin'), createValidation, createService);
router.put('/:id', protect, restrictTo('admin'), updateValidation, updateService);
router.delete('/:id', protect, restrictTo('admin'), deleteService);

export default router;
