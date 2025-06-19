import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables specifically for DB config if not already loaded globally
// This ensures DB config is available even if this module is imported early
const envFile = `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`;
dotenv.config({ path: path.resolve(__dirname, `../../.${envFile}`) }); // Adjusted path assuming mysql.ts is in backend/src/db/

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_cv_maker_db',
  waitForConnections: true,
  connectionLimit: 10, // Adjust as per your needs
  queueLimit: 0,
  // Recommended: Add SSL configuration for production databases
  // ssl: {
  //   ca: process.env.DB_SSL_CA_CERT, // Path to CA certificate file or string content
  //   // other SSL options like key, cert if using client certificates
  // }
};

// Create the connection pool
const pool = mysql.createPool(dbConfig);

// Function to test the database connection
export const testConnection = async (): Promise<void> => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Successfully connected to the database.');
    console.log(`Connected to host: ${dbConfig.host}, database: ${dbConfig.database}`);
    // Perform a simple query to ensure connection is working
    await connection.ping();
    console.log('Database ping successful.');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    // Optionally, rethrow the error if you want calling code to handle it
    // throw error;
  } finally {
    if (connection) {
      connection.release(); // Release the connection back to the pool
    }
  }
};

// Export the pool for use in other modules
export default pool;
