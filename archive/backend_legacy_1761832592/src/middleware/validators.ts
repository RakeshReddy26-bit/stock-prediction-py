import { check, validationResult, ValidationError } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const validateSignup = [
  check('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  check('referralCode')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Referral code must be 6 characters long'),
];

export const validateLogin = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
];

export const validatePasswordReset = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
];

export const validateResetPassword = [
  check('token')
    .trim()
    .notEmpty()
    .withMessage('Token is required'),
  
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err: ValidationError) => err.msg);
    throw new AppError(errorMessages.join(', '), 400);
  }
  next();
};