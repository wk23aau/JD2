import jwt from 'jsonwebtoken';
import config from '../config'; // Assuming config/index.ts exports JWT_SECRET and JWT_EXPIRES_IN

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
export const generateToken = (payload: JwtPayload, expiresIn?: string): string => {
  const secret = config.JWT_SECRET;
  if (!secret || secret === 'YOUR_DEFAULT_JWT_SECRET_CHANGE_ME') {
    console.error('CRITICAL: JWT_SECRET is not configured or is set to the default placeholder!');
    // In a real application, you might throw an error or prevent startup if JWT_SECRET is insecure.
    // For now, we'll proceed but this is a major security risk if not addressed.
  }

  const options: jwt.SignOptions = {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '1h', // Default to 1 hour
  };

  return jwt.sign(payload, secret, options);
};

/**
 * Verifies a JWT token.
 * @param token - The JWT string to verify.
 * @returns The decoded payload if the token is valid.
 * @throws Error if the token is invalid or expired.
 */
export const verifyToken = (token: string): JwtPayload => {
  const secret = config.JWT_SECRET;
  if (!secret) {
    // This should ideally not happen if config is loaded correctly
    throw new Error('JWT_SECRET not configured, cannot verify token.');
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload; // Cast to our expected payload type
    return decoded;
  } catch (error) {
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
