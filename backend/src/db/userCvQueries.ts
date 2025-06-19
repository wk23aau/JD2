import pool from './mysql';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Interface for the CV data stored as JSON
// This is a basic example; you might want to define it more strictly based on your CV structure
export interface UserCvJsonData {
  personalInfo: object;
  summary: string;
  experience: object[];
  education: object[];
  skills: object[];
  // Add any other sections your CV might have
}

// Interface for the User CV record from the database
export interface UserCvRecord extends RowDataPacket {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  cv_data: UserCvJsonData; // Parsed JSON data
  template_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CreateCvParams {
  userId: number;
  cvData: UserCvJsonData;
  title?: string; // Defaulted in DB schema, but can be provided
  description?: string | null;
  templateId?: string | null;
}

interface UpdateCvParams {
  title?: string;
  description?: string | null;
  cvData?: UserCvJsonData;
  templateId?: string | null;
}

/**
 * Creates a new CV for a user.
 * @param params - Object containing userId, cvData, title, description, templateId.
 * @returns The ID of the newly created CV.
 */
export const createCv = async (params: CreateCvParams): Promise<number> => {
  const { userId, cvData, title, description = null, templateId = null } = params;
  const sql = 'INSERT INTO user_cvs (user_id, cv_data, title, description, template_id) VALUES (?, ?, ?, ?, ?)';
  // If title is not provided, DB default 'Untitled CV' will be used.
  // Adjust query if title is strictly required from client or has a different default mechanism here.
  const effectiveTitle = title === undefined || title === null ? 'Untitled CV' : title;

  try {
    const [result] = await pool.query<ResultSetHeader>(sql, [userId, JSON.stringify(cvData), effectiveTitle, description, templateId]);
    if (result.insertId) {
      return result.insertId;
    } else {
      throw new Error('CV creation failed, no insertId returned.');
    }
  } catch (error) {
    console.error('Error in createCv:', error);
    throw new Error('Failed to create CV due to a database error.');
  }
};

/**
 * Fetches all CVs for a given user.
 * @param userId - The ID of the user whose CVs to fetch.
 * @returns An array of UserCvRecord (excluding full cv_data for list view).
 */
export const getUserCvs = async (userId: number): Promise<Partial<UserCvRecord>[]> => {
  const sql = 'SELECT id, user_id, title, description, template_id, created_at, updated_at FROM user_cvs WHERE user_id = ? ORDER BY updated_at DESC';
  try {
    const [rows] = await pool.query<UserCvRecord[]>(sql, [userId]);
    return rows;
  } catch (error) {
    console.error('Error in getUserCvs:', error);
    throw new Error('Database error while fetching user CVs.');
  }
};

/**
 * Fetches a specific CV by its ID, ensuring it belongs to the given user.
 * @param cvId - The ID of the CV to fetch.
 * @param userId - The ID of the user who owns the CV.
 * @returns The UserCvRecord if found and owned by user, otherwise undefined.
 */
export const getUserCvById = async (cvId: number, userId: number): Promise<UserCvRecord | undefined> => {
  const sql = 'SELECT * FROM user_cvs WHERE id = ? AND user_id = ?';
  try {
    const [rows] = await pool.query<UserCvRecord[]>(sql, [cvId, userId]);
    // cv_data is stored as JSON string, mysql2 driver auto-parses it.
    return rows[0];
  } catch (error) {
    console.error('Error in getUserCvById:', error);
    throw new Error('Database error while fetching specific CV.');
  }
};

/**
 * Updates an existing CV for a user.
 * @param cvId - The ID of the CV to update.
 * @param userId - The ID of the user who owns the CV.
 * @param updateData - Object containing fields to update (title, description, cv_data, template_id).
 * @returns True if update was successful, false otherwise.
 */
export const updateUserCv = async (cvId: number, userId: number, updateData: UpdateCvParams): Promise<boolean> => {
  const { title, description, cvData, templateId } = updateData;

  if (Object.keys(updateData).length === 0) {
    return false; // No data to update
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (title !== undefined) {
    fields.push('title = ?');
    values.push(title);
  }
  if (description !== undefined) {
    fields.push('description = ?');
    values.push(description);
  }
  if (cvData !== undefined) {
    fields.push('cv_data = ?');
    values.push(JSON.stringify(cvData));
  }
  if (templateId !== undefined) {
    fields.push('template_id = ?');
    values.push(templateId);
  }

  if (fields.length === 0) {
    return false; // Should not happen if Object.keys check passed, but as safeguard
  }

  const sql = `UPDATE user_cvs SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`;
  values.push(cvId, userId);

  try {
    const [result] = await pool.query<ResultSetHeader>(sql, values);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error in updateUserCv:', error);
    throw new Error('Failed to update CV due to a database error.');
  }
};

/**
 * Deletes a CV, ensuring it belongs to the given user.
 * @param cvId - The ID of the CV to delete.
 * @param userId - The ID of the user who owns the CV.
 * @returns True if deletion was successful, false otherwise.
 */
export const deleteUserCv = async (cvId: number, userId: number): Promise<boolean> => {
  const sql = 'DELETE FROM user_cvs WHERE id = ? AND user_id = ?';
  try {
    const [result] = await pool.query<ResultSetHeader>(sql, [cvId, userId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error in deleteUserCv:', error);
    throw new Error('Failed to delete CV due to a database error.');
  }
};
