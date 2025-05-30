import express from 'express';
import { verifyToken } from '../services/authService';

const router = express.Router();

// POST /api/auth/verify
router.post('/verify', verifyToken);

// The following routes are now handled in the users.ts file:
// GET /api/users/profile
// PUT /api/users/profile

export default router;