import mysql from 'mysql2/promise';
// import dotenv from 'dotenv'; // dotenv is now handled in config/index.ts
// import path from 'path'; // path might not be needed if not resolving paths here

// Import database configuration variables
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } from '../config'; // Adjusted path

const dbConfig = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
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
