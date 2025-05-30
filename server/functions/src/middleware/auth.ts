import { Request, Response, NextFunction } from 'express';
import { auth, firestore } from '../config/firebase';
import { CustomError } from '../utils/errors';
import { UserTier } from '../types/user';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      throw new CustomError('No token provided', 401);
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    const firebaseUser = await auth.getUser(decodedToken.uid);

    // Fetch user profile from Firestore
    const userDoc = await firestore.collection('users').doc(decodedToken.uid).get();
    const userProfile = userDoc.data();

    // Create complete user object
    req.user = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      customClaims: firebaseUser.customClaims,
      tier: userProfile?.tier || UserTier.Free,
      firstName: userProfile?.firstName,
      lastName: userProfile?.lastName,
      phoneNumber: userProfile?.phoneNumber,
      address: userProfile?.address,
      createdAt: userProfile?.createdAt || new Date().toISOString()
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('auth/id-token-expired')) {
        next(new CustomError('Token expired', 401));
      } else if (error.message.includes('auth/invalid-id-token')) {
        next(new CustomError('Invalid token', 401));
      } else {
        next(new CustomError('Authentication failed', 401));
      }
    } else {
      next(new CustomError('Unexpected authentication error', 500));
    }
  }
};