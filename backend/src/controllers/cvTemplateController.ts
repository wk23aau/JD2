import { Request, Response, NextFunction } from 'express';
import * as cvTemplateQueries from '../db/cvTemplateQueries';

/**
 * Handles the request to list all CV templates.
 * Fetches templates from the database and sends them as a JSON response.
 */
export const listCvTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const templates = await cvTemplateQueries.getAllCvTemplates();
    res.status(200).json(templates);
  } catch (error) {
    // Pass the error to the centralized error handling middleware
    next(error);
  }
};

/**
 * Handles the request to get a single CV template by its ID.
 * Fetches the template from the database and sends it as a JSON response.
 */
export const getCvTemplateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { templateId } = req.params;
  if (!templateId) {
    res.status(400).json({ message: 'Template ID is required.' });
    return;
  }

  try {
    const template = await cvTemplateQueries.getCvTemplateById(templateId);
    if (!template) {
      res.status(404).json({ message: 'CV template not found.' });
      return;
    }
    res.status(200).json(template);
  } catch (error) {
    // Pass the error to the centralized error handling middleware
    next(error);
  }
};
