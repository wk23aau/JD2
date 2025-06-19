import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config'; // Use named imports

export interface JwtPayload {
  userId: number;
  username: string;
  isAdmin?: boolean;
  // Add any other standard claims or custom claims you need (e.g., provider for OAuth)
}

/**
 * Generates a JWT token.
 * @param payload - The payload to include in the token (userId, username, isAdmin).
 * @param expiresIn - Optional. Token expiration time (e.g., '1h', '7d'). Defaults to value from config.
 * @returns The generated JWT string.
 */
export const generateToken = (payload: JwtPayload, customExpiresIn?: string): string => {
  if (!JWT_SECRET || JWT_SECRET === 'YOUR_DEFAULT_JWT_SECRET_CHANGE_ME') { // Check imported JWT_SECRET directly
    console.error('CRITICAL: JWT_SECRET is not configured or is set to the default placeholder in config/index.ts!');
    // Potentially throw an error in a production environment
    // throw new Error('JWT_SECRET is not securely configured.');
  }

  const options: jwt.SignOptions = {
    expiresIn: customExpiresIn || JWT_EXPIRES_IN, // Use imported JWT_EXPIRES_IN as default
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Verifies a JWT token.
 * @param token - The JWT string to verify.
 * @returns The decoded payload if the token is valid.
 * @throws Error if the token is invalid or expired.
 */
export const verifyToken = (token: string): JwtPayload => {
  if (!JWT_SECRET) {
    // This should ideally not happen if config is loaded correctly via config/index.ts
    console.error('CRITICAL: JWT_SECRET is not available for token verification.');
    throw new Error('JWT_SECRET not configured, cannot verify token.');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload; // Cast to our expected payload type
    return decoded;
  } catch (error: any) { // Catch as any to access error.name and error.message
    console.error('JWT verification error:', error.message);
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Failed to verify token');
  }
};
