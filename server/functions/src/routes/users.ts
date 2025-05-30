import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { getUserProfile, updateUserProfile } from '../services/authService';
import { getUserLimits, getUserTier, updateUserTier } from '../services/userService';
import { authMiddleware } from '../middleware/auth';
import { UserTier } from '../types/user';

const router = express.Router();

// All routes in this file should be protected
router.use(authMiddleware);

// GET /api/users/profile
router.get('/profile', getUserProfile);

// PUT /api/users/profile
router.put('/profile',
  body('displayName').optional().isString(),
  body('photoURL').optional().isURL(),
  validate,
  updateUserProfile
);

// GET /api/users/limits
router.get('/limits', getUserLimits);

// GET /api/users/tier
router.get('/tier', getUserTier);

// PUT /api/users/tier
router.put('/tier',
  body('tier').isIn(Object.values(UserTier)),
  validate,
  updateUserTier
);

export default router;