import express, { Request, Response, NextFunction, Router, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../db'; // Assuming db.ts is two levels up from routes/auth/
import { JWT_SECRET } from '../../config'; // Assuming config.ts is two levels up

const router = Router();

const registerHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        // It's common to send response directly for validation errors
        res.status(400).json({ message: 'Username, email, and password are required' });
        return;
    }

    try {
        // Check if user already exists
        const [existingUsers] = await pool.query<any[]>('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUsers.length > 0) {
            res.status(409).json({ message: 'User already exists with this email or username' });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert new user
        const [result] = await pool.query<any>(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, password_hash]
        );

        // Ensure result.insertId is valid before using it
        if (!result || !result.insertId) {
            // This case might indicate a DB issue not throwing an error but not returning expected result.
            throw new Error('User registration failed, no insertId returned.');
        }
        const newUser = { id: result.insertId, username, email };

        // Generate JWT
        const token = jwt.sign({ userId: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token, user: newUser });
    } catch (error) {
        // Pass error to Express error handling middleware
        next(error);
    }
};

const loginHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
    }

    try {
        // Find user by email
        const [users] = await pool.query<any[]>('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const user = users[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Generate JWT
        const token = jwt.sign({ userId: user.id, username: user.username, isAdmin: user.is_admin }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.is_admin
            }
        });
    } catch (error) {
        next(error);
    }
};

router.post('/register', registerHandler);
router.post('/login', loginHandler);

export default router;
