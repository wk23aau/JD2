import dotenv from 'dotenv';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'fallbacksecret';

// Google OAuth 2.0 Configuration
// =================================
// IMPORTANT: The values below are **placeholders**. You MUST replace them with your
// actual credentials obtained from the Google Cloud Platform (https://console.cloud.google.com/).
//
// Follow the setup instructions in the project's README.md for guidance on obtaining these credentials.

// GOOGLE_CLIENT_ID: Your Google OAuth 2.0 Client ID.
// Replace 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER' with your actual Client ID.
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER';

// GOOGLE_CLIENT_SECRET: Your Google OAuth 2.0 Client Secret.
// Replace 'YOUR_GOOGLE_CLIENT_SECRET_PLACEHOLDER' with your actual Client Secret.
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET_PLACEHOLDER';

// GOOGLE_CALLBACK_URL: The callback URL for Google OAuth 2.0.
// This URL *MUST* exactly match one of the "Authorized redirect URIs" you configured for your
// OAuth 2.0 client ID in the Google Cloud Console.
// It should be the full path to your backend's callback endpoint.
// For local development, this might be e.g., 'http://localhost:3001/api/auth/google/callback'.
// For production, this would be e.g., 'https://yourdomain.com/api/auth/google/callback'.
// The value from process.env.GOOGLE_CALLBACK_URL is preferred. If not set, it defaults to a relative path,
// which might work if the application is not behind a reverse proxy changing the path structure.
// Using a full URL in the .env file is generally safer for consistency.
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';
