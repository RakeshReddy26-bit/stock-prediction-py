import { Router } from 'express';
import { getAllServices } from '../controllers/serviceController';

const router = Router();

router.get('/', getAllServices);

export default router; 
