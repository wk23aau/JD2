import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware'; // Assuming AuthRequest is defined here or in types
import * as userCvQueries from '../db/userCvQueries';
import { UserCvJsonData } from '../db/userCvQueries'; // Import UserCvJsonData type

/**
 * Creates a new CV for the authenticated user.
 */
export const createCvHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    // This should ideally be caught by `protect` middleware, but as a safeguard
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }
  const userId = req.user.userId;
  const { cv_data, title, description, template_id } = req.body;

  // Basic validation
  if (!cv_data) {
    res.status(400).json({ message: 'cv_data is required.' });
    return;
  }
  // Add more validation for cv_data structure if needed

  try {
    const newCvId = await userCvQueries.createCv({
      userId,
      cvData: cv_data as UserCvJsonData, // Cast to ensure type, can add runtime validation
      title, // Will use DB default if undefined
      description,
      templateId: template_id,
    });

    // Fetch the created CV to return it in the response
    const createdCv = await userCvQueries.getUserCvById(newCvId, userId);
    if (!createdCv) {
        // Should not happen if creation was successful
        throw new Error('Failed to retrieve newly created CV.');
    }

    res.status(201).json(createdCv);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves all CVs for the authenticated user.
 */
export const getUserCvsHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }
  const userId = req.user.userId;

  try {
    const cvs = await userCvQueries.getUserCvs(userId);
    res.status(200).json(cvs);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a single CV by its ID for the authenticated user.
 */
export const getOneUserCvHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }
  const userId = req.user.userId;
  const cvId = parseInt(req.params.cvId, 10);

  if (isNaN(cvId)) {
    res.status(400).json({ message: 'Invalid CV ID format.' });
    return;
  }

  try {
    const cv = await userCvQueries.getUserCvById(cvId, userId);
    if (!cv) {
      res.status(404).json({ message: 'CV not found or you do not have permission to access it.' });
      return;
    }
    res.status(200).json(cv);
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an existing CV for the authenticated user.
 */
export const updateUserCvHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }
  const userId = req.user.userId;
  const cvId = parseInt(req.params.cvId, 10);
  const { title, description, cv_data, template_id } = req.body;

  if (isNaN(cvId)) {
    res.status(400).json({ message: 'Invalid CV ID format.' });
    return;
  }

  if (Object.keys(req.body).length === 0) {
    res.status(400).json({ message: 'No update data provided.' });
    return;
  }
  // Add more specific validation for cv_data if necessary

  try {
    // First, verify the CV exists and belongs to the user (optional, updateUserCv query also checks user_id)
    const existingCv = await userCvQueries.getUserCvById(cvId, userId);
    if (!existingCv) {
        res.status(404).json({ message: 'CV not found or you do not have permission to modify it.' });
        return;
    }

    const success = await userCvQueries.updateUserCv(cvId, userId, {
      title,
      description,
      cvData: cv_data as UserCvJsonData | undefined, // Cast, ensure validation if critical
      templateId: template_id,
    });

    if (!success) {
      // This might happen if affectedRows is 0, meaning CV not found for that user,
      // though the check above should catch it. Or no actual change in data.
      res.status(404).json({ message: 'CV not updated. It may not exist or no new data provided that differs.' });
      return;
    }

    const updatedCv = await userCvQueries.getUserCvById(cvId, userId);
    res.status(200).json(updatedCv);
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a CV for the authenticated user.
 */
export const deleteUserCvHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }
  const userId = req.user.userId;
  const cvId = parseInt(req.params.cvId, 10);

  if (isNaN(cvId)) {
    res.status(400).json({ message: 'Invalid CV ID format.' });
    return;
  }

  try {
    const success = await userCvQueries.deleteUserCv(cvId, userId);
    if (!success) {
      res.status(404).json({ message: 'CV not found or you do not have permission to delete it.' });
      return;
    }
    res.status(204).send(); // No Content
  } catch (error) {
    next(error);
  }
};
