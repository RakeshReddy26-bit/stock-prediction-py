import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message
      });
    }
  });
};

export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per windowMs
  'Too many requests from this IP, please try again after 15 minutes'
);

export const apiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  100, // 100 requests per windowMs
  'Too many requests from this IP, please try again after a minute'
);