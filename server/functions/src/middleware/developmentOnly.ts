import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/errors';

/**
 * Middleware to restrict access to development/testing environments only
 * Blocks access in production to prevent security vulnerabilities
 */
export const developmentOnlyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const functionsEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
  
  // Allow in development, testing, or when using Firebase emulator
  if (nodeEnv === 'development' || nodeEnv === 'test' || functionsEmulator) {
    next();
  } else {
    throw new CustomError(
      'This endpoint is only available in development/testing environments. ' +
      'In production, tier upgrades are handled via payment processing.',
      403
    );
  }
};