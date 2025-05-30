import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { CustomError } from '../utils/errors';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      throw new CustomError('No token provided', 401);
    }

    const decodedToken = await auth.verifyIdToken(token);
    const user = await auth.getUser(decodedToken.uid);

    // Attach the user to the request object
    (req as any).user = user;

    next();
  } catch (error) {
    next(new CustomError('Invalid or expired token', 401));
  }
};