import express, { Request, Response, NextFunction, Router, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../db'; // Assuming db.ts is two levels up from routes/auth/
import { JWT_SECRET } from '../../config'; // Assuming config.ts is two levels up
import passport from '../../middleware/passportConfig'; // Import passport

const router = Router();

const registerHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        // It's common to send response directly for validation errors
        res.status(400).json({ message: 'Username, email, and password are required' });
        return;
    }

    try {
        // Check if user already exists with the same email or username
        const [existingUsers] = await pool.query<any[]>('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUsers.length > 0) {
            const user = existingUsers[0];
            if (user.email === email && user.oauth_provider === 'google') {
                res.status(409).json({ message: 'This email is registered using Google. Please log in with Google.' });
                return;
            }
            // If username is taken, or email is taken by a non-Google account
            res.status(409).json({ message: 'User already exists with this email or username.' });
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
        // Find user by email
        const [users] = await pool.query<any[]>('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            res.status(401).json({ message: 'Invalid credentials or user not found.' });
            return;
        }

        const user = users[0];

        // Check if the account was created using Google
        if (user.oauth_provider === 'google' && !user.password_hash) {
            res.status(401).json({ message: 'This account was created using Google. Please log in with Google.' });
            return;
        }

        // If it's a regular account, but password_hash is somehow null (should not happen for non-OAuth users)
        if (!user.password_hash) {
            res.status(401).json({ message: 'Invalid account configuration. Please contact support.'});
            return;
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials.' });
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

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false, failureMessage: false })); // failureMessage requires session

// Custom callback for Google OAuth to handle success and failure explicitly
router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false, failureMessage: false }, (err: any, user: any, info: any) => {
        if (err) {
            // Handle errors, such as database errors or profile issues.
            // 'info' might contain specific error messages from the strategy if available.
            // e.g. if the verify callback in passportConfig.ts does done(new Error('Specific message'))
            let errorMessage = 'google_auth_failed';
            if (err && err.message) {
                // Sanitize or map error messages to codes to avoid leaking sensitive info
                if (err.message.includes("This email is already registered")) {
                    errorMessage = 'email_already_registered_local';
                } else if (err.message.includes("User not found")) { // Example from deserializeUser
                    errorMessage = 'user_not_found_post_auth';
                }
                // Log the actual error on the server for debugging
                console.error("Google OAuth Callback Error:", err.message);
            }
            return res.redirect(`${process.env.FRONTEND_LOGIN_URL || '/login'}?oauth_error=${errorMessage}`);
        }
        if (!user) {
            // Handle authentication failure (e.g., user denied access).
            // 'info' might contain messages like 'access_denied'.
            let failureReason = 'google_auth_denied';
            if (info && info.message) {
                 // Sanitize or map info messages
                if (info.message.toLowerCase().includes('access denied')) {
                    failureReason = 'access_denied_by_user';
                } else {
                    failureReason = 'unknown_google_failure';
                }
                console.log("Google OAuth Callback Info:", info.message);
            } else if (info) {
                console.log("Google OAuth Callback Info (raw):", info);
            }
            return res.redirect(`${process.env.FRONTEND_LOGIN_URL || '/login'}?oauth_error=${failureReason}`);
        }
        // Authentication successful, req.user is set by passport.
        // Proceed to generate token and redirect as before.
        const authenticatedUser = user; // req.user should be populated by passport
        // Generate JWT
        const token = jwt.sign(
            { userId: authenticatedUser.id, username: authenticatedUser.username, isAdmin: authenticatedUser.is_admin, provider: authenticatedUser.oauth_provider },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        const userQueryParam = encodeURIComponent(JSON.stringify({ id: authenticatedUser.id, username: authenticatedUser.username, email: authenticatedUser.email, provider: authenticatedUser.oauth_provider }));
        res.redirect(`${process.env.FRONTEND_URL || '/auth/google/callback_success'}?token=${token}&user=${userQueryParam}`);
    })(req, res, next);
});

export default router;
