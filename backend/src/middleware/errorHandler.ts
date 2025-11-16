import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.message
    });
  }

  // Handle Mongoose validation errors as 400 Bad Request
  if ((err as any).name === 'ValidationError') {
    const details = (err as any).errors
      ? Object.keys((err as any).errors).map((key) => ({
          field: key,
          message: (err as any).errors[key].message
        }))
      : undefined;

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: err instanceof Error ? err.message : 'Validation error',
      details
    });
  }

  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err instanceof Error ? err.message : 'Something went wrong!'
  });
};