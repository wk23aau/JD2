import pool from './mysql'; // Assuming mysql.ts exports the connection pool
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Define a more specific User type for what's stored/retrieved from DB
// This might differ from JWT payload or frontend User type
export interface UserRecord extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password_hash?: string | null;
  google_id?: string | null;
  oauth_provider?: string | null;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CreateUserParams {
  username: string;
  email: string;
  passwordHash: string;
  googleId?: string | null;
  oauthProvider?: string | null;
}

/**
 * Creates a new user in the database.
 * @param userData - Object containing username, email, and passwordHash.
 * @returns The ID of the newly created user.
 * @throws Error if user creation fails.
 */
export const createUser = async (userData: CreateUserParams): Promise<number> => {
  const { username, email, passwordHash, googleId = null, oauthProvider = null } = userData;
  const sql = 'INSERT INTO users (username, email, password_hash, google_id, oauth_provider) VALUES (?, ?, ?, ?, ?)';
  try {
    const [result] = await pool.query<ResultSetHeader>(sql, [username, email, passwordHash, googleId, oauthProvider]);
    if (result.insertId) {
      return result.insertId;
    } else {
      throw new Error('User creation failed, no insertId returned.');
    }
  } catch (error) {
    console.error('Error in createUser:', error);
    // Enhance error reporting or rethrow a custom error
    if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('User with this email or username already exists.');
    }
    throw new Error('Failed to create user due to a database error.');
  }
};

// Interface for data that can be updated by the user for their own profile
export interface UserUpdateData {
  username?: string;
  // Email updates would typically require a verification process, so not included in simple update.
  // Password updates should have a dedicated, secure flow (e.g., requiring current password).
}

/**
 * Updates a user's profile information (currently only username).
 * @param userId - The ID of the user to update.
 * @param updateData - An object containing the fields to update (e.g., { username }).
 * @returns The updated user object (UserRecord) or undefined if user not found or no changes made.
 * @throws Error if update fails due to database error or duplicate username.
 */
export const updateUser = async (userId: number, updateData: UserUpdateData): Promise<UserRecord | undefined> => {
  // Ensure there's something to update and only process allowed fields (e.g., username)
  if (!updateData.username || Object.keys(updateData).filter(k => k === 'username').length === 0) {
    // No valid fields to update or username is empty/not provided
    // Depending on desired behavior, could throw error or return current user
    const currentUser = await findUserById(userId);
    if (!currentUser) throw new Error("User not found for update check.");
    if (updateData.username && currentUser.username === updateData.username) return currentUser; // No actual change
    if (!updateData.username) throw new Error("Username cannot be empty for update."); // Or return current user
    // This path implies other, non-updatable fields might have been passed, or username was empty.
  }

  const { username } = updateData;

  // Construct the SQL query
  // We are only allowing username update for now.
  const sql = 'UPDATE users SET username = ? WHERE id = ?';
  const values = [username, userId];

  try {
    const [result] = await pool.query<ResultSetHeader>(sql, values);
    if (result.affectedRows === 0) {
      return undefined; // User not found or username was the same
    }
    // Return the updated user record
    return findUserById(userId);
  } catch (error) {
    console.error('Error in updateUser:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      // Check if the error message specifically mentions the username unique constraint
      if (error.message.includes('users.username_UNIQUE') || error.message.toLowerCase().includes("duplicate entry") && error.message.toLowerCase().includes("for key 'users.username'")) {
        throw new Error('User with this username already exists.');
      }
      // For other duplicate entries, if any, throw a more generic duplicate error
      throw new Error('This username is already taken.');
    }
    throw new Error('Failed to update user due to a database error.');
  }
};

/**
 * Finds a user by their Google ID.
 * @param googleId - The Google ID of the user to find.
 * @returns The user object if found, otherwise undefined.
 */
export const findUserByGoogleId = async (googleId: string): Promise<UserRecord | undefined> => {
  const sql = 'SELECT * FROM users WHERE google_id = ?';
  try {
    const [rows] = await pool.query<UserRecord[]>(sql, [googleId]);
    return rows[0];
  } catch (error) {
    console.error('Error in findUserByGoogleId:', error);
    throw new Error('Database error while searching for user by Google ID.');
  }
};

/**
 * Finds a user by their email address.
 * @param email - The email address of the user to find.
 * @returns The user object if found, otherwise undefined.
 */
export const findUserByEmail = async (email: string): Promise<UserRecord | undefined> => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  try {
    const [rows] = await pool.query<UserRecord[]>(sql, [email]);
    return rows[0];
  } catch (error) {
    console.error('Error in findUserByEmail:', error);
    throw new Error('Database error while searching for user by email.');
  }
};

/**
 * Finds a user by their ID.
 * @param id - The ID of the user to find.
 * @returns The user object if found, otherwise undefined.
 */
export const findUserById = async (id: number): Promise<UserRecord | undefined> => {
  const sql = 'SELECT * FROM users WHERE id = ?';
  try {
    const [rows] = await pool.query<UserRecord[]>(sql, [id]);
    return rows[0];
  } catch (error) {
    console.error('Error in findUserById:', error);
    throw new Error('Database error while searching for user by ID.');
  }
};
