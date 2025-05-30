import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { CustomError } from '../utils/errors';

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any; // Assuming you've set the user in the auth middleware
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
    const user = req.user as any; // Assuming you've set the user in the auth middleware
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

export const getUserLimits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any; // Assuming you've set the user in the auth middleware
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    // Implement logic to get user limits and usage
    // This is a placeholder, you'll need to implement the actual logic
    res.json({
      calculationLimit: 100,
      calculationsUsed: 50,
      isPremium: false
    });
  } catch (error) {
    next(error);
  }
};