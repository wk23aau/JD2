import { Router } from 'express';
import * as userController from '../controllers/userController';
import { protect } from '../middleware/authMiddleware'; // Ensure protect middleware is correctly imported

const router = Router();

// All routes in this file are protected and pertain to the authenticated user.

// @route   GET /api/users/me
// @desc    Get current authenticated user's profile
// @access  Private
router.get('/me', protect, userController.getUserProfile);

// @route   PUT /api/users/me
// @desc    Update current authenticated user's profile (e.g., username)
// @access  Private
router.put('/me', protect, userController.updateUserProfile);

export default router;
