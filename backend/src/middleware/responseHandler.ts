import { Request, Response, NextFunction } from 'express';

interface ResponseData {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const responseHandler = (req: Request, res: Response, next: NextFunction) => {
  // Store the original res.json method
  const originalJson = res.json.bind(res);

  // Override res.json method
  res.json = function (data: any) {
    // If the response is already formatted, return as is
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson(data);
    }

    // Format the response
    const formattedResponse: ResponseData = {
      success: true,
      data,
      meta: {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        total: Array.isArray(data) ? data.length : undefined,
        totalPages: Array.isArray(data) && req.query.limit
          ? Math.ceil(data.length / parseInt(req.query.limit as string))
          : undefined
      }
    };

    return originalJson(formattedResponse);
  };

  next();
}; 