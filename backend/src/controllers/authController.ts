import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import * as userQueries from '../db/userQueries';
import * as jwtService from '../services/jwtService';
import { FRONTEND_LOGIN_URL, FRONTEND_CALLBACK_SUCCESS_URL, NODE_ENV, PORT, JWT_EXPIRES_IN } from '../config'; // Named imports

/**
 * Registers a new user.
 */
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    res.status(400).json({ message: 'Username, email, and password are required.' });
    return;
  }
  if (password.length < 6) { // Example: Basic password length validation
    res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    return;
  }

  try {
    // Check if user already exists (by email or username)
    // Note: userQueries.createUser already throws an error for duplicate email/username due to DB constraints
    // but an explicit check can provide a clearer message or avoid hitting the DB for hashing if not needed.
    const existingUserByEmail = await userQueries.findUserByEmail(email);
    if (existingUserByEmail) {
      res.status(409).json({ message: 'User with this email already exists.' });
      return;
    }
    // Potentially check for username too if your findUserByUsername query exists and is needed before hashing
    // For now, createUser will handle duplicate username via DB constraint.

    // Hash the password
    const saltRounds = 10; // Standard practice
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user in the database
    const userId = await userQueries.createUser({ username, email, passwordHash });

    // Find the newly created user to get all details (especially if some are defaulted by DB)
    const newUser = await userQueries.findUserById(userId);
    if (!newUser) {
        // This should not happen if createUser was successful
        throw new Error('Failed to retrieve newly created user.');
    }

    // Generate JWT
    const tokenPayload: jwtService.JwtPayload = {
      userId: newUser.id,
      username: newUser.username,
      isAdmin: newUser.is_admin,
    };
    const token = jwtService.generateToken(tokenPayload, JWT_EXPIRES_IN); // Use imported JWT_EXPIRES_IN

    // Send response (excluding password hash and sensitive OAuth details if any)
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.is_admin,
        createdAt: newUser.created_at
      },
    });
  } catch (error) {
    // Pass error to central error handling middleware
    // If error is "User with this email or username already exists." from createUser, it will be passed.
    next(error);
  }
};

/**
 * Handles the callback from Google OAuth.
 * If authentication is successful, generates a JWT and redirects to the frontend.
 * req.user is populated by Passport's verify callback.
 */
export const googleCallback = (req: Request, res: Response, next: NextFunction): void => {
  // Passport populates req.user upon successful authentication.
  // It also can pass messages via req.authInfo if done(null, false, { message: ... }) was called.
  const authInfo = (req as any).authInfo as { message?: string } | undefined;

  if (authInfo && authInfo.message) {
    // If Passport's verify callback passed an error message (e.g., email already registered locally)
    // Redirect to login page with this specific error.
    // Ensure FRONTEND_LOGIN_URL is configured and handles 'oauth_error' and 'message' query params.
    const loginUrlBase = FRONTEND_LOGIN_URL.startsWith('http') ? FRONTEND_LOGIN_URL : (NODE_ENV === 'production' ? `https://${req.hostname}${FRONTEND_LOGIN_URL}` : `http://${req.hostname}:${PORT}${FRONTEND_LOGIN_URL}`);
    const redirectUrl = new URL(loginUrlBase);
    redirectUrl.searchParams.append('oauth_error', 'google_conflict'); // Generic error type
    redirectUrl.searchParams.append('message', authInfo.message);
    res.redirect(redirectUrl.toString());
    return;
  }

  if (!req.user) {
    // This case should ideally be caught by Passport's failureRedirect,
    // but as a fallback or if verify callback calls done(err) or done(null, false) without a message.
    const loginUrlBaseOnFailure = FRONTEND_LOGIN_URL.startsWith('http') ? FRONTEND_LOGIN_URL : (NODE_ENV === 'production' ? `https://${req.hostname}${FRONTEND_LOGIN_URL}` : `http://${req.hostname}:${PORT}${FRONTEND_LOGIN_URL}`);
    const redirectUrlOnFailure = new URL(loginUrlBaseOnFailure);
    redirectUrlOnFailure.searchParams.append('oauth_error', 'google_authentication_failed');
    res.redirect(redirectUrlOnFailure.toString());
    return;
  }

  // User is authenticated by Google and processed by Passport's verify callback.
  // req.user should be the user record from our database (UserRecord type).
  const dbUser = req.user as userQueries.UserRecord;

  try {
    const tokenPayload: jwtService.JwtPayload = {
      userId: dbUser.id,
      username: dbUser.username,
      isAdmin: dbUser.is_admin,
      // provider: dbUser.oauth_provider // Optionally include provider in JWT if needed by frontend
    };
    const token = jwtService.generateToken(tokenPayload, JWT_EXPIRES_IN); // Use imported JWT_EXPIRES_IN

    // Prepare user info for frontend (do not send sensitive data like password_hash or google_id directly)
    const frontendUser = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      isAdmin: dbUser.is_admin,
      provider: dbUser.oauth_provider,
    };

    // Redirect to frontend with token and user info
    // Ensure FRONTEND_CALLBACK_SUCCESS_URL is configured
    const successCallbackBase = FRONTEND_CALLBACK_SUCCESS_URL.startsWith('http') ? FRONTEND_CALLBACK_SUCCESS_URL : (NODE_ENV === 'production' ? `https://${req.hostname}${FRONTEND_CALLBACK_SUCCESS_URL}` : `http://${req.hostname}:${PORT}${FRONTEND_CALLBACK_SUCCESS_URL}`);
    const frontendCallbackSuccessUrl = new URL(successCallbackBase);
    frontendCallbackSuccessUrl.searchParams.append('token', token);
    frontendCallbackSuccessUrl.searchParams.append('user', JSON.stringify(frontendUser));

    res.redirect(frontendCallbackSuccessUrl.toString());

  } catch (error) {
    // Error during JWT generation or preparing redirect
    next(error); // Pass to central error handler
  }
};

/**
 * Logs in an existing user.
 */
export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    // Find user by email
    const user = await userQueries.findUserByEmail(email);

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' }); // Generic message for security
      return;
    }

    // Check if account is OAuth only
    if (!user.password_hash && user.oauth_provider) {
        res.status(401).json({ message: `This account is linked with ${user.oauth_provider}. Please use ${user.oauth_provider} to sign in.` });
        return;
    }

    if (!user.password_hash) {
        // Should not happen for a non-OAuth user if data integrity is maintained
        console.error(`User ${email} found without password_hash and not an OAuth user.`);
        res.status(500).json({ message: 'Account configuration error. Please contact support.' });
        return;
    }


    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' }); // Generic message
      return;
    }

    // Generate JWT
    const tokenPayload: jwtService.JwtPayload = {
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin,
    };
    const token = jwtService.generateToken(tokenPayload, JWT_EXPIRES_IN); // Use imported JWT_EXPIRES_IN

    // Send response
    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin,
      },
    });
  } catch (error) {
    // Pass error to central error handling middleware
    next(error);
  }
};
