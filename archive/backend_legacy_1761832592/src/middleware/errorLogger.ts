import { Request, Response, NextFunction } from 'express';

export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const error = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  };

  // Log error to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  // In production, you would log to a file or service
  // Example: winston.error(error);

  next(err);
};