import { Request, Response, NextFunction } from 'express';
import { auth, firestore } from '../config/firebase';
import { CustomError } from '../utils/errors';
import { UserRecord } from 'firebase-admin/auth';
import { UserProfile } from '../types/user';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      throw new CustomError('No token provided', 401);
    }
    const decodedToken = await auth.verifyIdToken(token);
    res.json({ uid: decodedToken.uid, email: decodedToken.email });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('auth/id-token-expired')) {
        next(new CustomError('Token expired', 401));
      } else if (error.message.includes('auth/invalid-id-token')) {
        next(new CustomError('Invalid token', 401));
      } else {
        next(new CustomError('Token verification failed', 401));
      }
    } else {
      next(new CustomError('Unexpected error during token verification', 500));
    }
  }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction, firestoreInstance = firestore) => {
  try {
    const user = req.user as UserRecord;
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    const userDoc = await firestoreInstance.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    const userProfile = userData?.profile || {};
    const userTier = userData?.tier || 'free';
    
    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      tier: userTier,
      profile: userProfile
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName, photoURL } = req.body;
    const user = (req as any).user;
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const updateData: { displayName?: string; photoURL?: string } = {};
    if (displayName) updateData.displayName = displayName;
    if (photoURL) updateData.photoURL = photoURL;

    if (Object.keys(updateData).length === 0) {
      throw new CustomError('No valid update data provided', 400);
    }

    await auth.updateUser(user.uid, updateData);
    const updatedUser = await auth.getUser(user.uid);
    const { uid, email, displayName: newDisplayName, photoURL: newPhotoURL, customClaims } = updatedUser;
    res.json({ uid, email, displayName: newDisplayName, photoURL: newPhotoURL, customClaims });
  } catch (error) {
    if (error instanceof Error) {
      next(new CustomError(error.message, error instanceof CustomError ? error.statusCode : 500));
    } else {
      next(new CustomError('Unexpected error during profile update', 500));
    }
  }
};