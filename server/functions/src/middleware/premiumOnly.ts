import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/errors';
import { UserTier } from '../types/user';

export const premiumOnlyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401);
    }

    if (req.user.tier !== UserTier.Premium) {
      throw new CustomError('Premium subscription required to access this feature', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};