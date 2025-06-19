import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware'; // Assuming AuthRequest is defined here or in types
import * as userQueries from '../db/userQueries';
import { UserRecord } from '../db/userQueries'; // Import UserRecord type

/**
 * Retrieves the profile of the authenticated user.
 * Returns only non-sensitive fields.
 */
export const getUserProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    // This should ideally be caught by `protect` middleware, but as a safeguard
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }
  const userId = req.user.userId;

  try {
    const user = await userQueries.findUserById(userId);
    if (!user) {
      // This is highly unlikely if the token is valid and refers to an existing user
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    // Select and return only non-sensitive fields
    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      oauth_provider: user.oauth_provider,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_admin: user.is_admin,
    };

    res.status(200).json(userProfile);
  } catch (error) {
    next(error);
  }
};

/**
 * Updates the profile of the authenticated user.
 * Currently allows updating 'username'.
 */
export const updateUserProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized.' });
    return;
  }
  const userId = req.user.userId;
  const { username } = req.body; // For now, only allow username update

  // Basic validation
  if (!username || typeof username !== 'string' || username.trim() === '') {
    res.status(400).json({ message: 'Username is required and must be a non-empty string.' });
    return;
  }

  // Optional: Add more validation for username (length, characters, etc.)
  if (username.length < 3 || username.length > 50) {
    res.status(400).json({ message: 'Username must be between 3 and 50 characters.' });
    return;
  }

  // Prevent updating username to the same as current if no other fields are changed
  // This check can be more sophisticated if other fields are updatable
  if (req.user.username === username.trim()) {
      // If only username is being updated and it's the same, no need to hit the DB.
      // Fetch current profile to return it, as if updated.
      return getUserProfile(req, res, next);
  }


  try {
    const updateData = { username: username.trim() };
    const updatedUser = await userQueries.updateUser(userId, updateData);

    if (!updatedUser) {
      // This could happen if updateUser returns undefined on no change or error
      // userQueries.updateUser should throw for actual errors.
      // If it returns undefined for "user not found", this is the correct handling.
      res.status(404).json({ message: 'User not found or update failed.' });
      return;
    }

    // Return the updated profile (selected fields)
    const userProfile = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        oauth_provider: updatedUser.oauth_provider,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
        is_admin: updatedUser.is_admin,
      };

    res.status(200).json(userProfile);
  } catch (error) {
    // Handle specific errors like duplicate username from userQueries.updateUser
    if (error.message.includes('User with this username already exists')) {
        res.status(409).json({ message: 'This username is already taken. Please choose another.' });
        return;
    }
    next(error); // Pass other errors to the centralized error handler
  }
};
