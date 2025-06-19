import dotenv from 'dotenv';
import path from 'path';

// Determine the environment (development, test, production)
const detectedNodeEnv = process.env.NODE_ENV || 'development';

// Construct the path to the correct .env file
// .env files should be in the root of the 'backend' directory.
// __dirname for this file is backend/src/config
const envPath = path.resolve(__dirname, `../../.env${detectedNodeEnv !== 'development' ? `.${detectedNodeEnv}` : ''}`);

// Load the environment variables from the determined .env file
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  console.warn(`Warning: Could not load .env file from ${envPath}. Error: ${dotenvResult.error.message}`);
  if (detectedNodeEnv === 'development' && !process.env.CI) {
    console.warn("Ensure you have a .env file in the 'backend' root directory (e.g., .env or .env.development).");
    console.warn("Refer to .env.example for required variables.");
  }
} else {
  if (dotenvResult.parsed) {
    console.log(`Successfully loaded environment variables from: ${envPath}`);
  }
}

// Define and export configuration variables
export const NODE_ENV = detectedNodeEnv;
export const PORT = process.env.PORT || '3001';

// Database Configuration
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_USER = process.env.DB_USER || 'root';
export const DB_PASSWORD = process.env.DB_PASSWORD || '';
export const DB_NAME = process.env.DB_NAME || 'ai_cv_maker_db_new';

// JWT Configuration
const defaultJwtSecret = 'YOUR_DEFAULT_JWT_SECRET_CHANGE_ME'; // Use a more descriptive default
export const JWT_SECRET = process.env.JWT_SECRET || defaultJwtSecret;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Google OAuth 2.0 Configuration
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET_PLACEHOLDER';
// Ensure GOOGLE_CALLBACK_URL is a full URL as required by Google and Passport config
// Defaulting to a common local setup. This should be overridden by .env for production or specific dev setups.
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/api/auth/google/callback`;

// Frontend URL (for redirects)
// Defaulting to common local setup. These should be overridden by .env for production.
export const FRONTEND_LOGIN_URL = process.env.FRONTEND_LOGIN_URL || 'http://localhost:3000/login';
export const FRONTEND_CALLBACK_SUCCESS_URL = process.env.FRONTEND_CALLBACK_SUCCESS_URL || 'http://localhost:3000/auth/google/callback_success';


// CORS Configuration
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'; // More specific default than '*'

// Google Gemini API Key
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_PLACEHOLDER';

// Log warnings for missing or placeholder critical configurations
if (NODE_ENV === 'production') {
  if (JWT_SECRET === defaultJwtSecret) {
    console.error('CRITICAL SECURITY WARNING: JWT_SECRET is not set to a secure value in production!');
  }
  if (CORS_ORIGIN === '*' || CORS_ORIGIN === 'http://localhost:3000') { // Check against typical dev default too
    console.warn('Security Warning: CORS_ORIGIN is not set to a production frontend URL. Please verify CORS_ORIGIN environment variable.');
  }
  if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER' || GOOGLE_CLIENT_SECRET === 'YOUR_GOOGLE_CLIENT_SECRET_PLACEHOLDER') {
    console.warn('Warning: Google OAuth credentials are using placeholder values. Google Sign-In will not work in production.');
  }
  if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_PLACEHOLDER' || !GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY is not set or is a placeholder. AI features will not work in production.');
  }
} else { // Development warnings
    if (JWT_SECRET === defaultJwtSecret) {
        console.warn('Warning: JWT_SECRET is using a default placeholder. Consider setting a custom one in your .env file for better security.');
    }
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER' || GOOGLE_CLIENT_SECRET === 'YOUR_GOOGLE_CLIENT_SECRET_PLACEHOLDER') {
        console.warn('Warning: Google OAuth credentials are using placeholder values. Google Sign-In may not work as expected.');
    }
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_PLACEHOLDER' || !GEMINI_API_KEY) {
        console.warn('Warning: GEMINI_API_KEY is not set or is a placeholder. AI features may not work as expected. Obtain a key from Google AI Studio.');
    }
}
