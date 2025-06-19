import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../../db';
import { protect, AuthRequest } from '../../middleware/authMiddleware';

const router = Router();

const createCvHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const { cv_data, template_id, name } = req.body;
    const userId = authReq.user?.userId;

    if (!cv_data) {
        res.status(400).json({ message: 'cv_data is required' });
        return;
    }

    try {
        const [result] = await pool.query<any>(
            'INSERT INTO cvs (user_id, cv_data, template_id, name) VALUES (?, ?, ?, ?)',
            [userId, JSON.stringify(cv_data), template_id || null, name || 'Untitled CV']
        );

        if (!result || !result.insertId) {
            throw new Error('CV creation failed, no insertId returned from database.');
        }
        const newCvId = result.insertId;
        const [newCvRows] = await pool.query<any[]>('SELECT * FROM cvs WHERE id = ?', [newCvId]);

        if (newCvRows.length === 0) {
            // This case should ideally not happen if insertId was valid
            throw new Error('Failed to retrieve newly created CV immediately after insertion.');
        }

        const newCv = newCvRows[0];
        // Parse cv_data from string to JSON before sending response
        try {
            if (typeof newCv.cv_data === 'string') { // Ensure it's a string before parsing
                newCv.cv_data = JSON.parse(newCv.cv_data);
            }
        } catch (parseError) {
            console.error("Error parsing cv_data from DB on create:", parseError);
            // Decide how to handle: send as string, or error out?
            // For now, let it pass as string if it was, or throw if critical
            // throw new Error('Error processing CV data from database after creation.');
        }

        res.status(201).json(newCv);
    } catch (error) {
        next(error);
    }
};

const getAllCvsHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    try {
        const [cvs] = await pool.query<any[]>('SELECT id, user_id, template_id, name, created_at, updated_at FROM cvs WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
        res.json(cvs);
    } catch (error) {
        next(error);
    }
};

const getCvByIdHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const cvId = req.params.id;
    const userId = authReq.user?.userId;
    try {
        const [cvs] = await pool.query<any[]>('SELECT * FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (cvs.length === 0) {
            res.status(404).json({ message: 'CV not found or not authorized' });
            return;
        }
        const cv = cvs[0];
        try {
            if (typeof cv.cv_data === 'string') {
                cv.cv_data = JSON.parse(cv.cv_data);
            }
        } catch (parseError) {
            console.error("Error parsing cv_data from DB on get single:", parseError);
            // This is a critical error if cv_data is expected to be JSON by frontend
            throw new Error('Error processing CV data from database.');
        }
        res.json(cv);
    } catch (error) {
        next(error);
    }
};

const updateCvHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const cvId = req.params.id;
    const userId = authReq.user?.userId;
    const { cv_data, template_id, name } = req.body;

    if (cv_data === undefined && template_id === undefined && name === undefined) {
        res.status(400).json({ message: 'No fields to update provided' });
        return;
    }

    try {
        const [existingCvs] = await pool.query<any[]>('SELECT id FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (existingCvs.length === 0) {
            res.status(404).json({ message: 'CV not found or not authorized for update' });
            return;
        }

        let query = 'UPDATE cvs SET ';
        const params: any[] = [];
        if (cv_data !== undefined) {
            query += 'cv_data = ?, ';
            params.push(JSON.stringify(cv_data));
        }
        if (template_id !== undefined) {
            query += 'template_id = ?, ';
            params.push(template_id);
        }
        if (name !== undefined) {
            query += 'name = ?, ';
            params.push(name);
        }
        query += 'updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?';
        params.push(cvId, userId);

        query = query.replace(', updated_at', ' updated_at'); // Remove trailing comma if only one field updated

        const [updateResult] = await pool.query<any>(query, params);
        if (updateResult.affectedRows === 0) {
             // This might happen if data sent is same as existing, or CV just deleted by another request.
            // Consider if this is an error or just an "ok, no change".
            // For now, let's assume it means something unexpected if we already verified ownership.
            // However, if no actual data changed, affectedRows can be 0 but not an error.
            // Let's fetch the CV to be sure.
        }

        const [updatedCvRows] = await pool.query<any[]>('SELECT * FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (updatedCvRows.length === 0) {
            // This would be very strange if update didn't error and CV was there before.
            throw new Error('Failed to retrieve updated CV after update operation.');
        }
        const updatedCv = updatedCvRows[0];
        try {
            if (typeof updatedCv.cv_data === 'string') {
                updatedCv.cv_data = JSON.parse(updatedCv.cv_data);
            }
        } catch (parseError) {
             console.error("Error parsing cv_data from DB on update:", parseError);
             // As above, decide if this is critical
        }

        res.json(updatedCv);
    } catch (error) {
        next(error);
    }
};

const deleteCvHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const cvId = req.params.id;
    const userId = authReq.user?.userId;
    try {
        const [result] = await pool.query<any>('DELETE FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'CV not found or not authorized for deletion' });
            return;
        }
        res.status(200).json({ message: 'CV deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Define routes
router.post('/', protect, createCvHandler);
router.get('/', protect, getAllCvsHandler);
router.get('/:id', protect, getCvByIdHandler);
router.put('/:id', protect, updateCvHandler);
router.delete('/:id', protect, deleteCvHandler);

export default router;
