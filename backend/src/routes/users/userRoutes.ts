import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../../db';
import { protect, AuthRequest } from '../../middleware/authMiddleware'; // AuthRequest might need to extend express.Request
import bcrypt from 'bcrypt';

const router = Router();

// Extend AuthRequest to include NextFunction if it's to be used with RequestHandler directly
// Or, ensure AuthRequest is compatible. For now, let's assume AuthRequest is primarily for req.user.

// Type the handlers directly with AuthRequest
const getUserProfileHandler: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // req.user is now directly available with the correct type
        const [users] = await pool.query<any[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [req.user?.userId]);
        if (users.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(users[0]);
    } catch (error) {
        // console.error('Get user profile error:', error); // Logging now in central error handler
        next(error);
    }
};

const updateUserProfileHandler: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;
    const userId = req.user?.userId; // req.user is now directly available

    if (!username && !email && !password) {
        res.status(400).json({ message: 'No fields to update' });
        return;
    }

    try {
        let query = 'UPDATE users SET ';
        const params: any[] = [];

        if (username) {
            query += 'username = ?, ';
            params.push(username);
        }
        if (email) {
            query += 'email = ?, ';
            params.push(email);
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query += 'password_hash = ?, ';
            params.push(password_hash);
        }

        query += 'updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params.push(userId);

        // Remove trailing comma if any before 'updated_at'
        query = query.replace(', updated_at', ' updated_at');


        const [result] = await pool.query<any>(query, params);

        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'User not found or no changes made' });
            return;
        }

        const [updatedUsers] = await pool.query<any[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [userId]);
        res.json(updatedUsers[0]);

    } catch (error: any) {
        // console.error('Update user profile error:', error); // Logging now in central error handler
        if (error.code === 'ER_DUP_ENTRY') {
            // For specific errors like this, it's common to send a specific status code directly
            res.status(409).json({ message: 'Username or email already taken.' });
            return;
        }
        next(error); // Pass other errors to the central handler
    }
};

// GET /api/users/me - Get current user's profile
router.get('/me', protect, getUserProfileHandler);

// PUT /api/users/me - Update current user's profile
router.put('/me', protect, updateUserProfileHandler);

export default router;
