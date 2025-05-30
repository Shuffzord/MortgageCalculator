import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { verifyToken, getCurrentUser, updateUserProfile } from '../services/authService';

const router = express.Router();

// POST /api/auth/verify
router.post('/verify', 
  body('token').isString().notEmpty(),
  validate,
  verifyToken
);

// GET /api/auth/user
router.get('/user', getCurrentUser);

// PUT /api/auth/user
router.put('/user',
  body('displayName').optional().isString(),
  body('email').optional().isEmail(),
  validate,
  updateUserProfile
);

export default router;