import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { CustomError } from '../utils/errors';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const decodedToken = await auth.verifyIdToken(token);
    res.json({ uid: decodedToken.uid });
  } catch (error) {
    next(new CustomError('Invalid token', 401));
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName, email } = req.body;
    const user = req.user;
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (displayName) {
      await auth.updateUser(user.uid, { displayName });
    }
    if (email) {
      await auth.updateUser(user.uid, { email });
    }

    const updatedUser = await auth.getUser(user.uid);
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};