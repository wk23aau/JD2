import { Request, Response, NextFunction } from 'express';
import * as jwtService from '../services/jwtService'; // Assuming jwtService.ts is in ../services/
// No need to import 'config' here if jwtService handles its own config for secret

// This interface defines the structure of the decoded JWT payload
// It's what we expect to get back after verifying a valid token.
// It should align with jwtService.JwtPayload.
export interface DecodedJwtPayload extends jwtService.JwtPayload {
  // Can add iat, exp if needed, but typically not directly used by app logic from req.user
}

// This interface extends the default Express Request object
// to include our custom 'user' property, which will hold the decoded JWT payload.
export interface AuthRequest extends Request {
  user?: DecodedJwtPayload; // user property is optional, as not all requests will be authenticated
}

/**
 * Middleware to protect routes by verifying JWT.
 * If the token is valid, it attaches the decoded user payload to `req.user`.
 * Otherwise, it sends an appropriate error response.
 */
export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    if (!token) {
      // It's good practice to set WWW-Authenticate header for 401 responses
      // res.setHeader('WWW-Authenticate', 'Bearer realm="Access to protected resources"');
      res.status(401).json({ message: 'Not authorized, no token provided.' });
      return;
    }

    try {
      const decodedPayload = jwtService.verifyToken(token);
      req.user = decodedPayload; // Attach decoded payload to req.user
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      // res.setHeader('WWW-Authenticate', 'Bearer realm="Access to protected resources", error="invalid_token"');
      if (error.message === 'Token expired') {
        res.status(401).json({ message: 'Not authorized, token expired.' });
      } else if (error.message === 'Invalid token') {
        res.status(401).json({ message: 'Not authorized, token invalid.' });
      } else {
        // Generic error for other verification failures
        console.error("Token verification unhandled error:", error); // Log unexpected errors
        res.status(401).json({ message: 'Not authorized, token verification failed.' });
      }
    }
  } else {
    // res.setHeader('WWW-Authenticate', 'Bearer realm="Access to protected resources"');
    res.status(401).json({ message: 'Not authorized, no Bearer token found in authorization header.' });
  }
};

/**
 * Middleware to check for admin privileges.
 * Should be used after the `protect` middleware.
 */
export const admin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.isAdmin) {
    next(); // User is admin, proceed
  } else {
    // User is not an admin, or req.user is not populated (shouldn't happen if `protect` ran and succeeded)
    res.status(403).json({ message: 'Forbidden: Access restricted to administrators.' });
  }
};
