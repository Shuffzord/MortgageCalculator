import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { getUserProfile, updateUserProfile, getUserLimits } from '../services/userService';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes in this file should be protected
router.use(authMiddleware);

// GET /api/users/profile
router.get('/profile', getUserProfile);

// PUT /api/users/profile
router.put('/profile',
  body('displayName').optional().isString(),
  body('email').optional().isEmail(),
  validate,
  updateUserProfile
);

// GET /api/users/limits
router.get('/limits', getUserLimits);

export default router;