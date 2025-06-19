import { Router } from 'express';
import * as userCvController from '../controllers/userCvController';
import { protect } from '../middleware/authMiddleware'; // Assuming protect middleware is correctly set up

const router = Router();

// All routes in this file are protected and require authentication.
router.use(protect); // Apply protect middleware to all routes defined below

// @route   POST /api/cvs
// @desc    Create a new CV for the authenticated user
// @access  Private
router.post('/', userCvController.createCvHandler);

// @route   GET /api/cvs
// @desc    Get all CVs for the authenticated user
// @access  Private
router.get('/', userCvController.getUserCvsHandler);

// @route   GET /api/cvs/:cvId
// @desc    Get a specific CV by ID for the authenticated user
// @access  Private
router.get('/:cvId', userCvController.getOneUserCvHandler);

// @route   PUT /api/cvs/:cvId
// @desc    Update a specific CV by ID for the authenticated user
// @access  Private
router.put('/:cvId', userCvController.updateUserCvHandler);

// @route   DELETE /api/cvs/:cvId
// @desc    Delete a specific CV by ID for the authenticated user
// @access  Private
router.delete('/:cvId', userCvController.deleteUserCvHandler);

export default router;
