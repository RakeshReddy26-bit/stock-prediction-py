import express from 'express';
import { signup, login, forgotPassword, resetPassword } from '../controllers/authController';
import { validateSignup, validateLogin, validatePasswordReset, validateResetPassword, validate } from '../middleware/validators';

const router = express.Router();

router.post('/signup', validateSignup, validate, signup);
router.post('/login', validateLogin, validate, login);
router.post('/forgot-password', validatePasswordReset, validate, forgotPassword);
router.post('/reset-password', validateResetPassword, validate, resetPassword);

export default router;