import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error: ${err.message}`, { 
    error: err, 
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      errors: err.serializeErrors(),
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
  });
};