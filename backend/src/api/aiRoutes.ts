import { Router } from 'express';
import * as aiController from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware'; // AI features should be protected

const router = Router();

// All AI-related routes will be protected and require authentication.
router.use(protect);

// @route   POST /api/ai/suggest/summary
// @desc    Generate a CV summary suggestion
// @access  Private (User Token Required)
router.post('/suggest/summary', aiController.generateSummaryHandler);

// @route   POST /api/ai/suggest/experience
// @desc    Generate bullet points for a work experience entry
// @access  Private (User Token Required)
router.post('/suggest/experience', aiController.generateExperiencePointsHandler);

// Add more AI suggestion routes here as needed
// e.g., for skills, education details, cover letter snippets, etc.

export default router;
