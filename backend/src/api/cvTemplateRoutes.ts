import { Router } from 'express';
import * as cvTemplateController from '../controllers/cvTemplateController';

const router = Router();

// @route   GET /api/cv-templates
// @desc    Get all CV templates
// @access  Public
router.get('/', cvTemplateController.listCvTemplates);

// @route   GET /api/cv-templates/:templateId
// @desc    Get a single CV template by ID
// @access  Public
router.get('/:templateId', cvTemplateController.getCvTemplateById);

export default router;
