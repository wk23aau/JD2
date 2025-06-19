import pool from './mysql'; // Assuming mysql.ts exports the connection pool
import { RowDataPacket } from 'mysql2';

// Interface for the CV Template record from the database
export interface CvTemplateRecord extends RowDataPacket {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  default_theme_settings?: any | null; // Stored as JSON, parsed as 'any' or a specific theme settings interface
}

/**
 * Fetches all CV templates from the database.
 * @returns A promise that resolves to an array of CvTemplateRecord.
 * @throws Error if database query fails.
 */
export const getAllCvTemplates = async (): Promise<CvTemplateRecord[]> => {
  const sql = 'SELECT id, name, description, image_url, default_theme_settings FROM cv_templates';
  try {
    const [rows] = await pool.query<CvTemplateRecord[]>(sql);
    // MySQL JSON type is automatically parsed by mysql2 driver if not explicitly disabled
    return rows;
  } catch (error) {
    console.error('Error in getAllCvTemplates:', error);
    throw new Error('Database error while fetching CV templates.');
  }
};

/**
 * Fetches a single CV template by its ID.
 * @param templateId - The ID of the template to fetch.
 * @returns A promise that resolves to a CvTemplateRecord if found, otherwise undefined.
 * @throws Error if database query fails.
 */
export const getCvTemplateById = async (templateId: string): Promise<CvTemplateRecord | undefined> => {
  const sql = 'SELECT id, name, description, image_url, default_theme_settings FROM cv_templates WHERE id = ?';
  try {
    const [rows] = await pool.query<CvTemplateRecord[]>(sql, [templateId]);
    return rows[0];
  } catch (error) {
    console.error('Error in getCvTemplateById:', error);
    throw new Error('Database error while fetching CV template by ID.');
  }
};
