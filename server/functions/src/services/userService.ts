import { Request, Response, NextFunction } from 'express';
import { auth, firestore } from '../config/firebase';
import { CustomError } from '../utils/errors';
import { UserProfile, UserTier, UpdateUserData } from '../types/user';
import { getUserUsageLimits } from '../middleware/usageTracking';

export const getUserProfile = async (req: Request, res: Response, next: NextFunction, firestoreInstance = firestore) => {
  try {
    if (!req.user) {
      throw new CustomError('User not found', 404);
    }
    
    const userDoc = await firestoreInstance.collection('users').doc(req.user.uid).get();
    const userProfile = userDoc.data() as UserProfile;
    
    res.json({
      ...req.user,
      profile: userProfile
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateData: UpdateUserData = req.body;
    if (!req.user) {
      throw new CustomError('User not found', 404);
    }

    if (updateData.displayName || updateData.photoURL) {
      await auth.updateUser(req.user.uid, {
        displayName: updateData.displayName,
        photoURL: updateData.photoURL
      });
    }

    if (updateData.profile) {
      await firestore.collection('users').doc(req.user.uid).set(updateData.profile, { merge: true });
    }

    const updatedUser = await auth.getUser(req.user.uid);
    const updatedUserDoc = await firestore.collection('users').doc(req.user.uid).get();
    const updatedProfile = updatedUserDoc.data() as UserProfile;

    res.json({ ...updatedUser, profile: updatedProfile });
  } catch (error) {
    next(error);
  }
};

export const getUserLimits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('User not found', 404);
    }

    if (!req.user.tier) {
      throw new CustomError('User tier not found', 400);
    }

    const usageLimits = await getUserUsageLimits(req.user.uid, req.user.tier);
    
    res.json({
      success: true,
      data: usageLimits
    });
  } catch (error) {
    next(error);
  }
};

export const getUserTier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('User not found', 404);
    }
    res.json({ tier: req.user.tier });
  } catch (error) {
    next(error);
  }
};

export const updateUserTier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tier } = req.body;
    if (!req.user) {
      throw new CustomError('User not found', 404);
    }

    if (!Object.values(UserTier).includes(tier)) {
      throw new CustomError('Invalid tier', 400);
    }

    await firestore.collection('users').doc(req.user.uid).update({ tier });
    res.json({ message: 'User tier updated successfully', tier });
  } catch (error) {
    next(error);
  }
};