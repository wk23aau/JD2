import dotenv from 'dotenv';
import path from 'path';

// Determine the environment (development, test, production)
const NODE_ENV = process.env.NODE_ENV || 'development';

// Construct the path to the correct .env file
// .env files should be in the root of the 'backend' directory.
// __dirname for this file is backend/src/config
const envPath = path.resolve(__dirname, `../../.env${NODE_ENV !== 'development' ? `.${NODE_ENV}` : ''}`);

// Load the environment variables from the determined .env file
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  // This error should ideally not happen in production if .env files are set up correctly
  // For local development, it's a critical warning.
  console.warn(`Warning: Could not load .env file from ${envPath}. Error: ${dotenvResult.error.message}`);
  if (NODE_ENV === 'development' && !process.env.CI) { // Don't show if we are in CI or not in dev
    console.warn("Ensure you have a .env file in the 'backend' root directory (e.g., .env or .env.development).");
    console.warn("Refer to .env.example for required variables.");
  }
} else {
  if (dotenvResult.parsed) {
    console.log(`Successfully loaded environment variables from: ${envPath}`);
    // console.log('Loaded variables:', Object.keys(dotenvResult.parsed)); // For debugging
  }
}


// Define and export configuration variables
// Provide defaults for critical variables if not set, but log warnings.

const config = {
  NODE_ENV: NODE_ENV,
  PORT: process.env.PORT || '3001',

  // Database Configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'ai_cv_maker_db_new', // Changed default to avoid conflict if old DB exists

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'YOUR_DEFAULT_JWT_SECRET_CHANGE_ME',

  // Google OAuth 2.0 Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET_PLACEHOLDER',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback', // Relative path might be okay if proxied

  // Frontend URL (for redirects, e.g., OAuth failures)
  FRONTEND_LOGIN_URL: process.env.FRONTEND_LOGIN_URL || '/login', // Relative path for simple cases

  // CORS Configuration (Example - could be more granular)
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*', // Allow all origins by default - CHANGE FOR PRODUCTION!

  // Google Gemini API Key
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_PLACEHOLDER',
};

// Log warnings for missing critical configurations (especially for production)
if (config.NODE_ENV === 'production') {
  if (config.JWT_SECRET === 'YOUR_DEFAULT_JWT_SECRET_CHANGE_ME') {
    console.error('CRITICAL SECURITY WARNING: JWT_SECRET is not set to a secure value in production!');
  }
  if (config.CORS_ORIGIN === '*') {
    console.warn('Security Warning: CORS_ORIGIN is set to allow all origins (*). This is not recommended for production.');
  }
  if (config.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER' || config.GOOGLE_CLIENT_SECRET === 'YOUR_GOOGLE_CLIENT_SECRET_PLACEHOLDER') {
    console.warn('Warning: Google OAuth credentials are placeholders. Google Sign-In will not work in production.');
  }
  if (config.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_PLACEHOLDER') {
    console.warn('Warning: GEMINI_API_KEY is a placeholder. AI features will not work in production.');
  }
} else { // Development warnings
    if (config.JWT_SECRET === 'YOUR_DEFAULT_JWT_SECRET_CHANGE_ME') {
        console.warn('Warning: JWT_SECRET is using a default placeholder. Consider setting a custom one in your .env file.');
    }
    if (config.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_PLACEHOLDER') {
        console.warn('Warning: GEMINI_API_KEY is a placeholder. AI features may not work as expected. Obtain a key from Google AI Studio.');
    }
}


export default Object.freeze(config); // Freeze to prevent runtime modification
