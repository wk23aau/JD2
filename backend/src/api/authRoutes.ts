import { Router } from 'express';
import passport from '../services/passportConfig'; // Import configured Passport
import * as authController from '../controllers/authController';
import config from '../config'; // For FRONTEND_LOGIN_URL
// import { protect, AuthRequest } from '../middleware/authMiddleware'; // AuthRequest for typed req if needed

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', authController.loginUser);

// Example of a protected route that might be in authRoutes (e.g., to get current authenticated user's basic info)
// Though typically /me routes are in userRoutes
// router.get('/me', protect, (req: AuthRequest, res) => { // AuthRequest would need to be imported
//   res.status(200).json({ user: req.user });
// });


// Google OAuth Routes
// Step 1: Redirect to Google for authentication
// session: false because we are using JWTs, not sessions.
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// Step 2: Google redirects back to this URL after authentication
// Passport middleware handles the token exchange with Google.
// If successful, req.user is populated, and authController.googleCallback is called.
// If failure (e.g., user denies access, or an error in verify callback not resulting in a user),
// Passport redirects to failureRedirect.
router.get(
    '/google/callback',
    passport.authenticate('google', {
        // Using a relative path for FRONTEND_LOGIN_URL from config.
        // The actual construction of the full URL for redirection in case of failure
        // during the Passport strategy execution (e.g. if done(err) is called in verify callback)
        // is handled by how Passport forms the redirect from this path.
        // If FRONTEND_LOGIN_URL is a full URL, it will be used directly.
        // A more robust failureRedirect might involve a custom callback to pass detailed error to frontend.
        failureRedirect: `${config.FRONTEND_LOGIN_URL}?oauth_error=google_authentication_failed_at_passport`,
        session: false,
        // failureFlash: true // If you were using flash messages with sessions
    }),
    authController.googleCallback // This is called only on successful authentication by Google
);

export default router;
